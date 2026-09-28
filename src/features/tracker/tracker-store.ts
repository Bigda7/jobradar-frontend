import { useSyncExternalStore } from 'react';

import type { JobResponse, MatchResponse } from '../../api';
import {
  basePatch,
  isTrackerStorageKey,
  lifecyclePatch,
  loadTrackerData,
  notesPatch,
  placementPatch,
  type TrackerPatch,
  type TrackerStorage,
} from './tracker-persistence';
import {
  allTrackerStatuses,
  createEmptyTrackerState,
  trackerStateSchema,
  trackerStorageKey,
  type TrackerRecord,
  type TrackerSnapshot,
  type TrackerState,
  type TrackerStatus,
} from './tracker-schema';

export type { TrackerStorage } from './tracker-persistence';

interface TrackerStoreOptions {
  storage?: TrackerStorage | null;
  storageKey?: string;
  now?: () => string;
}

type Opportunity = JobResponse | MatchResponse;
type Listener = () => void;

export interface TrackerStore {
  getState: () => TrackerState;
  getPersistenceError: () => string | null;
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
  refreshFromStorage: () => void;
}

const trackerPersistenceError =
  'Tracker changes could not be saved in this browser. They may be lost after reload.';

function getBrowserStorage(): TrackerStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createSnapshot(opportunity: Opportunity): TrackerSnapshot {
  return {
    title: opportunity.title,
    company: opportunity.company,
    sourceName: opportunity.source_name,
    sourceDisplayName: opportunity.source_display_name,
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
  let ranks = new Map<string, number>();
  let persistenceError =
    storage === null && typeof window !== 'undefined'
      ? trackerPersistenceError
      : null;

  if (storage) {
    try {
      const loaded = loadTrackerData(storage, storageKey);
      state = loaded.state;
      ranks = loaded.ranks;
    } catch {
      state = createEmptyTrackerState();
      persistenceError = trackerPersistenceError;
    }
  }
  const listeners = new Set<Listener>();
  const pendingPatches = new Map<string, string>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const refreshFromStorage = () => {
    if (!storage || pendingPatches.size > 0) {
      return;
    }

    try {
      const loaded = loadTrackerData(storage, storageKey);
      if (JSON.stringify(loaded.state) !== JSON.stringify(state)) {
        state = loaded.state;
        notify();
      }
      ranks = loaded.ranks;
    } catch {
      persistenceError = trackerPersistenceError;
      notify();
    }
  };

  const rankAtEnd = (status: TrackerStatus) =>
    Math.max(0, ...state.order[status].map((id) => ranks.get(id) ?? 0)) + 1_024;

  const commit = (nextState: TrackerState, patches: TrackerPatch[]) => {
    const validated = trackerStateSchema.parse(nextState);
    state = validated;

    if (storage) {
      for (const patch of patches) {
        pendingPatches.set(patch.key, patch.value);
      }
      try {
        for (const [key, value] of pendingPatches) {
          storage.setItem(key, value);
        }
        pendingPatches.clear();
        persistenceError = null;
        const loaded = loadTrackerData(storage, storageKey);
        state = loaded.state;
        ranks = loaded.ranks;
      } catch {
        persistenceError = trackerPersistenceError;
      }
    } else if (typeof window !== 'undefined') {
      persistenceError = trackerPersistenceError;
    }

    notify();
  };

  return {
    getState: () => state,
    getPersistenceError: () => persistenceError,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    saveOpportunity: (opportunity) => {
      refreshFromStorage();
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

      const patches = [basePatch(id, record, storageKey)];
      if (!existing) {
        const rank = rankAtEnd('saved');
        ranks.set(id, rank);
        patches.push(
          notesPatch(id, record.notes, timestamp, storageKey),
          placementPatch(id, { status: 'saved', rank, updatedAt: timestamp }, storageKey),
          lifecyclePatch(id, false, timestamp, storageKey),
        );
      }
      commit(nextState, patches);
      return record;
    },
    setStatus: (opportunityId, status) => {
      refreshFromStorage();
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
      const rank = rankAtEnd(status);
      ranks.set(id, rank);
      commit(nextState, [
        placementPatch(id, {
          status,
          rank,
          updatedAt: nextState.records[id].updatedAt,
        }, storageKey),
      ]);
      return true;
    },
    move: (opportunityId, status, targetIndex) => {
      refreshFromStorage();
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
      const previousId = target[index - 1];
      const nextId = target[index + 1];
      const previousRank = previousId ? (ranks.get(previousId) ?? 0) : null;
      const nextRank = nextId ? (ranks.get(nextId) ?? 0) : null;
      const rank =
        previousRank === null
          ? nextRank === null
            ? 1_024
            : nextRank - 1_024
          : nextRank === null
            ? previousRank + 1_024
            : (previousRank + nextRank) / 2;
      let patches: TrackerPatch[];
      if (
        !Number.isFinite(rank) ||
        rank === previousRank ||
        rank === nextRank
      ) {
        patches = target.map((itemId, position) => {
          const itemRank = (position + 1) * 1_024;
          ranks.set(itemId, itemRank);
          return placementPatch(itemId, {
            status,
            rank: itemRank,
            updatedAt: nextState.records[itemId].updatedAt,
          }, storageKey);
        });
      } else {
        ranks.set(id, rank);
        patches = [
          placementPatch(id, {
            status,
            rank,
            updatedAt: nextState.records[id].updatedAt,
          }, storageKey),
        ];
      }
      commit(nextState, patches);
      return true;
    },
    setNotes: (opportunityId, notes) => {
      refreshFromStorage();
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
      commit(nextState, [
        notesPatch(id, nextState.records[id].notes, nextState.records[id].updatedAt, storageKey),
      ]);
      return true;
    },
    removeOpportunity: (opportunityId) => {
      refreshFromStorage();
      const id = String(opportunityId);
      const existing = state.records[id];

      if (!existing) {
        return false;
      }

      const nextState = structuredClone(state);
      delete nextState.records[id];
      removeFromOrder(nextState, id);
      ranks.delete(id);
      commit(nextState, [lifecyclePatch(id, true, now(), storageKey)]);
      return true;
    },
    refreshFromStorage,
  };
}

export const trackerStore = createTrackerStore();

export function startTrackerStorageSync(
  store: TrackerStore = trackerStore,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!isTrackerStorageKey(event.key)) {
      return;
    }

    try {
      if (event.storageArea && event.storageArea !== window.localStorage) {
        return;
      }
    } catch {
      return;
    }

    store.refreshFromStorage();
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

export function useTrackerState(): TrackerState {
  return useSyncExternalStore(
    trackerStore.subscribe,
    trackerStore.getState,
    trackerStore.getState,
  );
}

export function useTrackerPersistenceError(): string | null {
  return useSyncExternalStore(
    trackerStore.subscribe,
    trackerStore.getPersistenceError,
    trackerStore.getPersistenceError,
  );
}

export function getActiveTrackerCount(state: TrackerState): number {
  return Object.values(state.records).filter(
    (record) => record.status !== 'archived',
  ).length;
}
