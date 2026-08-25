import { z } from 'zod';

import {
  opportunityKindSchema,
  safeExternalUrlSchema,
  workModeSchema,
} from '../../api';

export const trackerStorageKey = 'jobradar.tracker.v1';

export const trackerStatusSchema = z.enum([
  'saved',
  'applied',
  'interview',
  'offer',
  'archived',
]);

export type TrackerStatus = z.infer<typeof trackerStatusSchema>;

export const pipelineStatuses: TrackerStatus[] = [
  'saved',
  'applied',
  'interview',
  'offer',
];

export const allTrackerStatuses: TrackerStatus[] = [
  ...pipelineStatuses,
  'archived',
];

export const trackerSnapshotSchema = z.object({
  title: z.string().max(10_000),
  company: z.string().max(10_000).nullable(),
  kind: opportunityKindSchema,
  workMode: workModeSchema,
  salaryMin: z.string().max(100).nullable(),
  salaryMax: z.string().max(100).nullable(),
  salaryCurrency: z.string().max(32).nullable(),
  salaryPeriod: z.string().max(64).nullable(),
  publishedAt: z.string().max(100).nullable(),
  sourceUrl: safeExternalUrlSchema.optional(),
});

export type TrackerSnapshot = z.infer<typeof trackerSnapshotSchema>;

export const trackerRecordSchema = z.object({
  opportunityId: z.number().int().nonnegative(),
  status: trackerStatusSchema,
  notes: z.string().max(5_000),
  snapshot: trackerSnapshotSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type TrackerRecord = z.infer<typeof trackerRecordSchema>;

const trackerOrderSchema = z.object({
  saved: z.array(z.string()).max(2_000),
  applied: z.array(z.string()).max(2_000),
  interview: z.array(z.string()).max(2_000),
  offer: z.array(z.string()).max(2_000),
  archived: z.array(z.string()).max(2_000),
});

export const trackerStateSchema = z.object({
  version: z.literal(1),
  records: z.record(z.string(), trackerRecordSchema),
  order: trackerOrderSchema,
});

export type TrackerState = z.infer<typeof trackerStateSchema>;

const legacyTrackerStateSchema = z.object({
  version: z.literal(0),
  items: z.array(trackerRecordSchema),
});

export function createEmptyTrackerState(): TrackerState {
  return {
    version: 1,
    records: {},
    order: {
      saved: [],
      applied: [],
      interview: [],
      offer: [],
      archived: [],
    },
  };
}

function normalizeTrackerState(state: TrackerState): TrackerState {
  const normalized = createEmptyTrackerState();

  for (const record of Object.values(state.records).slice(0, 2_000)) {
    normalized.records[String(record.opportunityId)] = record;
  }

  const placed = new Set<string>();

  for (const status of allTrackerStatuses) {
    for (const id of state.order[status]) {
      const record = normalized.records[id];

      if (record?.status === status && !placed.has(id)) {
        normalized.order[status].push(id);
        placed.add(id);
      }
    }
  }

  for (const [id, record] of Object.entries(normalized.records)) {
    if (!placed.has(id)) {
      normalized.order[record.status].push(id);
    }
  }

  return normalized;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recoverTrackerRecord(value: unknown): TrackerRecord | null {
  const parsed = trackerRecordSchema.safeParse(value);

  if (parsed.success) {
    return parsed.data;
  }

  if (!isObject(value) || !isObject(value.snapshot)) {
    return null;
  }

  const snapshot = { ...value.snapshot };
  delete snapshot.sourceUrl;
  const withoutUnsafeUrl = trackerRecordSchema.safeParse({
    ...value,
    snapshot,
  });

  return withoutUnsafeUrl.success ? withoutUnsafeUrl.data : null;
}

function recoverCurrentTrackerState(input: unknown): TrackerState | null {
  if (!isObject(input) || input.version !== 1 || !isObject(input.records)) {
    return null;
  }

  const recovered = createEmptyTrackerState();

  for (const value of Object.values(input.records).slice(0, 2_000)) {
    const record = recoverTrackerRecord(value);

    if (record) {
      recovered.records[String(record.opportunityId)] = record;
    }
  }

  if (isObject(input.order)) {
    for (const status of allTrackerStatuses) {
      const order = input.order[status];

      if (Array.isArray(order)) {
        recovered.order[status] = order
          .filter((id): id is string => typeof id === 'string')
          .slice(0, 2_000);
      }
    }
  }

  return normalizeTrackerState(recovered);
}

export function migrateTrackerState(input: unknown): TrackerState {
  const current = trackerStateSchema.safeParse(input);

  if (current.success) {
    return normalizeTrackerState(current.data);
  }

  const recovered = recoverCurrentTrackerState(input);

  if (recovered) {
    return recovered;
  }

  const legacy = legacyTrackerStateSchema.safeParse(input);

  if (!legacy.success) {
    return createEmptyTrackerState();
  }

  const migrated = createEmptyTrackerState();

  for (const record of legacy.data.items) {
    const id = String(record.opportunityId);
    migrated.records[id] = record;
    migrated.order[record.status].push(id);
  }

  return normalizeTrackerState(migrated);
}

export function parseTrackerState(serialized: string | null): TrackerState {
  if (!serialized) {
    return createEmptyTrackerState();
  }

  try {
    return migrateTrackerState(JSON.parse(serialized) as unknown);
  } catch {
    return createEmptyTrackerState();
  }
}
