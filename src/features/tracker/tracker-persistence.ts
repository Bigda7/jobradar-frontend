import { z } from 'zod';

import {
  allTrackerStatuses,
  createEmptyTrackerState,
  migrateTrackerState,
  parseTrackerState,
  trackerRecordSchema,
  trackerStateSchema,
  trackerStatusSchema,
  trackerStorageKey,
  type TrackerRecord,
  type TrackerState,
} from './tracker-schema';

export interface TrackerStorage {
  readonly length: number;
  getItem: (key: string) => string | null;
  key: (index: number) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface TrackerPatch {
  key: string;
  value: string;
}

interface TrackerPlacement {
  status: TrackerRecord['status'];
  rank: number;
  updatedAt: string;
}

export interface LoadedTrackerData {
  state: TrackerState;
  ranks: Map<string, number>;
}

function recordStoragePrefix(storageKey: string): string {
  return `${storageKey}.record.`;
}
const storedNotesSchema = z.object({
  notes: z.string().max(5_000),
  updatedAt: z.iso.datetime({ offset: true }),
});
const storedPlacementSchema = z.object({
  status: trackerStatusSchema,
  rank: z.number().finite(),
  updatedAt: z.iso.datetime({ offset: true }),
});
const storedLifecycleSchema = z.object({
  deleted: z.boolean(),
  updatedAt: z.iso.datetime({ offset: true }),
});

type TrackerField = 'base' | 'notes' | 'placement' | 'lifecycle';

export function trackerFieldKey(
  id: string,
  field: TrackerField,
  storageKey = trackerStorageKey,
): string {
  return `${recordStoragePrefix(storageKey)}${id}.${field}`;
}

export function isTrackerStorageKey(
  key: string | null,
  storageKey = trackerStorageKey,
): boolean {
  return (
    key === null ||
    key === storageKey ||
    key.startsWith(recordStoragePrefix(storageKey))
  );
}

function readJson(storage: TrackerStorage, key: string): unknown {
  const serialized = storage.getItem(key);
  if (serialized === null) {
    return null;
  }

  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    return null;
  }
}

function readBaseRecord(
  storage: TrackerStorage,
  id: string,
  storageKey: string,
): TrackerRecord | null {
  const value = readJson(storage, trackerFieldKey(id, 'base', storageKey));
  const parsed = trackerRecordSchema.safeParse(value);
  if (parsed.success && String(parsed.data.opportunityId) === id) {
    return parsed.data;
  }

  const recovered = migrateTrackerState({
    version: 1,
    records: { [id]: value },
    order: createEmptyTrackerState().order,
  }).records[id];
  return recovered ?? null;
}

function storedRecordIds(storage: TrackerStorage, storageKey: string): Set<string> {
  const ids = new Set<string>();
  const prefix = recordStoragePrefix(storageKey);
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) {
      continue;
    }

    const field = key.slice(prefix.length);
    const match = /^(\d+)\.(base|notes|placement|lifecycle)$/.exec(field);
    if (match && String(Number(match[1])) === match[1]) {
      ids.add(match[1]);
    }
  }
  return ids;
}

function latestTimestamp(...timestamps: string[]): string {
  return timestamps.reduce((latest, candidate) =>
    Date.parse(candidate) > Date.parse(latest) ? candidate : latest,
  );
}

export function loadTrackerData(
  storage: TrackerStorage,
  storageKey = trackerStorageKey,
): LoadedTrackerData {
  const legacy = parseTrackerState(storage.getItem(storageKey));
  const records: Record<string, TrackerRecord> = { ...legacy.records };
  const ranks = new Map<string, number>();

  for (const status of allTrackerStatuses) {
    legacy.order[status].forEach((id, index) => {
      ranks.set(id, (index + 1) * 1_024);
    });
  }

  for (const id of storedRecordIds(storage, storageKey)) {
    const base = readBaseRecord(storage, id, storageKey);
    if (base) {
      records[id] = base;
    }

    const lifecycle = storedLifecycleSchema.safeParse(
      readJson(storage, trackerFieldKey(id, 'lifecycle', storageKey)),
    );
    if (lifecycle.success && lifecycle.data.deleted) {
      delete records[id];
      ranks.delete(id);
      continue;
    }

    const record = records[id];
    if (!record) {
      continue;
    }

    const notes = storedNotesSchema.safeParse(
      readJson(storage, trackerFieldKey(id, 'notes', storageKey)),
    );
    const placement = storedPlacementSchema.safeParse(
      readJson(storage, trackerFieldKey(id, 'placement', storageKey)),
    );
    const updatedAt = latestTimestamp(
      record.updatedAt,
      ...(notes.success ? [notes.data.updatedAt] : []),
      ...(placement.success ? [placement.data.updatedAt] : []),
      ...(lifecycle.success ? [lifecycle.data.updatedAt] : []),
    );
    records[id] = {
      ...record,
      notes: notes.success ? notes.data.notes : record.notes,
      status: placement.success ? placement.data.status : record.status,
      updatedAt,
    };
    if (placement.success) {
      ranks.set(id, placement.data.rank);
    }
  }

  const state = createEmptyTrackerState();
  state.records = records;
  const orderedIds = Object.keys(records).sort((left, right) => {
    const rankDifference =
      (ranks.get(left) ?? Number.MAX_SAFE_INTEGER) -
      (ranks.get(right) ?? Number.MAX_SAFE_INTEGER);
    return rankDifference || Number(left) - Number(right);
  });
  for (const id of orderedIds) {
    state.order[records[id].status].push(id);
  }

  return { state: trackerStateSchema.parse(state), ranks };
}

export function basePatch(
  id: string,
  record: TrackerRecord,
  storageKey = trackerStorageKey,
): TrackerPatch {
  return { key: trackerFieldKey(id, 'base', storageKey), value: JSON.stringify(record) };
}

export function notesPatch(
  id: string,
  notes: string,
  updatedAt: string,
  storageKey = trackerStorageKey,
): TrackerPatch {
  return {
    key: trackerFieldKey(id, 'notes', storageKey),
    value: JSON.stringify({ notes, updatedAt }),
  };
}

export function placementPatch(
  id: string,
  placement: TrackerPlacement,
  storageKey = trackerStorageKey,
): TrackerPatch {
  return {
    key: trackerFieldKey(id, 'placement', storageKey),
    value: JSON.stringify(placement),
  };
}

export function lifecyclePatch(
  id: string,
  deleted: boolean,
  updatedAt: string,
  storageKey = trackerStorageKey,
): TrackerPatch {
  return {
    key: trackerFieldKey(id, 'lifecycle', storageKey),
    value: JSON.stringify({ deleted, updatedAt }),
  };
}
