import { z } from 'zod';

import { opportunityKindSchema, workModeSchema } from '../../api';

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
  title: z.string(),
  company: z.string().nullable(),
  kind: opportunityKindSchema,
  workMode: workModeSchema,
  salaryMin: z.string().nullable(),
  salaryMax: z.string().nullable(),
  salaryCurrency: z.string().nullable(),
  salaryPeriod: z.string().nullable(),
  publishedAt: z.string().nullable(),
  sourceUrl: z.url().optional(),
});

export type TrackerSnapshot = z.infer<typeof trackerSnapshotSchema>;

export const trackerRecordSchema = z.object({
  opportunityId: z.number().int(),
  status: trackerStatusSchema,
  notes: z.string().max(5_000),
  snapshot: trackerSnapshotSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TrackerRecord = z.infer<typeof trackerRecordSchema>;

const trackerOrderSchema = z.object({
  saved: z.array(z.string()),
  applied: z.array(z.string()),
  interview: z.array(z.string()),
  offer: z.array(z.string()),
  archived: z.array(z.string()),
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
  normalized.records = state.records;
  const placed = new Set<string>();

  for (const status of allTrackerStatuses) {
    for (const id of state.order[status]) {
      const record = state.records[id];

      if (record?.status === status && !placed.has(id)) {
        normalized.order[status].push(id);
        placed.add(id);
      }
    }
  }

  for (const [id, record] of Object.entries(state.records)) {
    if (!placed.has(id)) {
      normalized.order[record.status].push(id);
    }
  }

  return normalized;
}

export function migrateTrackerState(input: unknown): TrackerState {
  const current = trackerStateSchema.safeParse(input);

  if (current.success) {
    return normalizeTrackerState(current.data);
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
