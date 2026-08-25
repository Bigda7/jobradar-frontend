import { useSyncExternalStore } from 'react';

import type { JobResponse, MatchResponse } from '../../api';
import {
  allTrackerStatuses,
  createEmptyTrackerState,
  parseTrackerState,
  trackerStateSchema,
  trackerStorageKey,
  type TrackerRecord,
  type TrackerSnapshot,
  type TrackerState,
  type TrackerStatus,
} from './tracker-schema';

export interface TrackerStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface TrackerStoreOptions {
  storage?: TrackerStorage | null;
  storageKey?: string;
  now?: () => string;
}

type Opportunity = JobResponse | MatchResponse;
type Listener = () => void;

export interface TrackerStore {
  getState: () => TrackerState;
  subscribe: (listener: Listener) => () => void;
  saveOpportunity: (opportunity: Opportunity) => TrackerRecord;
  setStatus: (opportunityId: number, status: TrackerStatus) => boolean;
  move: (
    opportunityId: number,
    status: TrackerStatus,
    targetIndex?: number,
  ) => boolean;
  setNotes: (opportunityId: number, notes: string) => boolean;
  removeOpportunity: (opportunityId: number) => boolean;
  applySerializedState: (serialized: string | null) => void;
}

function getBrowserStorage(): TrackerStorage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function createSnapshot(opportunity: Opportunity): TrackerSnapshot {
  return {
    title: opportunity.title,
    company: opportunity.company,
    kind: opportunity.kind,
    workMode: opportunity.work_mode,
    salaryMin: opportunity.salary_min,
    salaryMax: opportunity.salary_max,
    salaryCurrency: opportunity.salary_currency,
    salaryPeriod: opportunity.salary_period,
    publishedAt: opportunity.published_at,
    ...('source_url' in opportunity
      ? { sourceUrl: opportunity.source_url }
      : {}),
  };
}

function removeFromOrder(state: TrackerState, id: string): void {
  for (const status of allTrackerStatuses) {
    state.order[status] = state.order[status].filter((itemId) => itemId !== id);
  }
}

export function createTrackerStore(
  options: TrackerStoreOptions = {},
): TrackerStore {
  const storage = options.storage === undefined ? getBrowserStorage() : options.storage;
  const storageKey = options.storageKey ?? trackerStorageKey;
  const now = options.now ?? (() => new Date().toISOString());
  let state = createEmptyTrackerState();

  if (storage) {
    try {
      state = parseTrackerState(storage.getItem(storageKey));
    } catch {
      state = createEmptyTrackerState();
    }
  }
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commit = (nextState: TrackerState, persist = true) => {
    const validated = trackerStateSchema.parse(nextState);
    state = validated;

    if (persist && storage) {
      try {
        storage.setItem(storageKey, JSON.stringify(validated));
      } catch {
        state = validated;
      }
    }

    notify();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    saveOpportunity: (opportunity) => {
      const id = String(opportunity.id);
      const existing = state.records[id];
      const timestamp = now();
      const incomingSnapshot = createSnapshot(opportunity);
      const snapshot = existing?.snapshot.sourceUrl
        ? { ...incomingSnapshot, sourceUrl: existing.snapshot.sourceUrl }
        : incomingSnapshot;
      const record: TrackerRecord = existing
        ? {
            ...existing,
            snapshot,
            updatedAt: timestamp,
          }
        : {
            opportunityId: opportunity.id,
            status: 'saved',
            notes: '',
            snapshot,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
      const nextState = structuredClone(state);
      nextState.records[id] = record;

      if (!existing) {
        nextState.order.saved.push(id);
      }

      commit(nextState);
      return record;
    },
    setStatus: (opportunityId, status) => {
      const id = String(opportunityId);
      const existing = state.records[id];

      if (!existing || existing.status === status) {
        return Boolean(existing);
      }

      const nextState = structuredClone(state);
      removeFromOrder(nextState, id);
      nextState.order[status].push(id);
      nextState.records[id] = {
        ...existing,
        status,
        updatedAt: now(),
      };
      commit(nextState);
      return true;
    },
    move: (opportunityId, status, targetIndex) => {
      const id = String(opportunityId);
      const existing = state.records[id];

      if (!existing) {
        return false;
      }

      const nextState = structuredClone(state);
      removeFromOrder(nextState, id);
      const target = nextState.order[status];
      const index = Math.max(0, Math.min(targetIndex ?? target.length, target.length));
      target.splice(index, 0, id);
      nextState.records[id] = {
        ...existing,
        status,
        updatedAt: now(),
      };
      commit(nextState);
      return true;
    },
    setNotes: (opportunityId, notes) => {
      const id = String(opportunityId);
      const existing = state.records[id];

      if (!existing) {
        return false;
      }

      const nextState = structuredClone(state);
      nextState.records[id] = {
        ...existing,
        notes: notes.slice(0, 5_000),
        updatedAt: now(),
      };
      commit(nextState);
      return true;
    },
    removeOpportunity: (opportunityId) => {
      const id = String(opportunityId);
      const existing = state.records[id];

      if (!existing) {
        return false;
      }

      const nextState = structuredClone(state);
      delete nextState.records[id];
      removeFromOrder(nextState, id);
      commit(nextState);
      return true;
    },
    applySerializedState: (serialized) => {
      commit(parseTrackerState(serialized), false);
    },
  };
}

export const trackerStore = createTrackerStore();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === trackerStorageKey && event.storageArea === window.localStorage) {
      trackerStore.applySerializedState(event.newValue);
    }
  });
}

export function useTrackerState(): TrackerState {
  return useSyncExternalStore(
    trackerStore.subscribe,
    trackerStore.getState,
    trackerStore.getState,
  );
}

export function getActiveTrackerCount(state: TrackerState): number {
  return Object.values(state.records).filter(
    (record) => record.status !== 'archived',
  ).length;
}
