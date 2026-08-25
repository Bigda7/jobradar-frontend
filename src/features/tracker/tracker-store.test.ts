import { describe, expect, it } from 'vitest';

import type { JobResponse, MatchResponse } from '../../api';
import {
  migrateTrackerState,
  trackerStorageKey,
  type TrackerRecord,
} from './tracker-schema';
import {
  createTrackerStore,
  type TrackerStorage,
} from './tracker-store';

class MemoryStorage implements TrackerStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createJob(overrides: Partial<JobResponse> = {}): JobResponse {
  return {
    id: 42,
    kind: 'employment',
    status: 'active',
    title: 'Frontend Developer',
    company: 'Example Labs',
    description: null,
    location_text: null,
    work_mode: 'remote',
    employment_type: 'full_time',
    contract_type: null,
    salary_min: '1200.00',
    salary_max: '1800.00',
    salary_currency: 'USD',
    salary_period: 'month',
    published_at: '2026-08-25T10:00:00Z',
    first_seen_at: '2026-08-25T10:00:00Z',
    last_seen_at: '2026-08-25T10:00:00Z',
    ...overrides,
  };
}

function createMatch(overrides: Partial<MatchResponse> = {}): MatchResponse {
  return {
    ...createJob(),
    source_url: 'https://example.com/job/42',
    score: 88,
    reasons: [],
    concerns: [],
    rules_version: 'test',
    ...overrides,
  };
}

describe('tracker store', () => {
  it('persists saved opportunities under the versioned key', () => {
    const storage = new MemoryStorage();
    const store = createTrackerStore({
      storage,
      now: () => '2026-08-25T12:00:00Z',
    });

    store.saveOpportunity(createJob());

    expect(store.getState().records['42']).toMatchObject({
      opportunityId: 42,
      status: 'saved',
      notes: '',
    });
    expect(storage.getItem(trackerStorageKey)).toContain('Frontend Developer');
  });

  it('refreshes the snapshot without resetting progress or notes', () => {
    const store = createTrackerStore({
      storage: new MemoryStorage(),
      now: () => '2026-08-25T12:00:00Z',
    });
    store.saveOpportunity(createJob());
    store.setStatus(42, 'interview');
    store.setNotes(42, 'Second interview on Friday');

    store.saveOpportunity(
      createMatch({ title: 'Senior Frontend Developer' }),
    );

    expect(store.getState().records['42']).toMatchObject({
      status: 'interview',
      notes: 'Second interview on Friday',
      snapshot: {
        title: 'Senior Frontend Developer',
        sourceUrl: 'https://example.com/job/42',
      },
    });
  });

  it('moves records between columns and preserves explicit ordering', () => {
    const store = createTrackerStore({
      storage: new MemoryStorage(),
      now: () => '2026-08-25T12:00:00Z',
    });
    store.saveOpportunity(createJob({ id: 1 }));
    store.saveOpportunity(createJob({ id: 2 }));
    store.move(2, 'applied');
    store.move(1, 'applied', 0);

    expect(store.getState().order.applied).toEqual(['1', '2']);
    expect(store.getState().records['1'].status).toBe('applied');
  });

  it('migrates legacy item arrays into version 1 ordering', () => {
    const record: TrackerRecord = {
      opportunityId: 42,
      status: 'offer',
      notes: '',
      snapshot: {
        title: 'Frontend Developer',
        company: 'Example Labs',
        kind: 'employment',
        workMode: 'remote',
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        salaryPeriod: null,
        publishedAt: null,
      },
      createdAt: '2026-08-25T12:00:00Z',
      updatedAt: '2026-08-25T12:00:00Z',
    };

    const migrated = migrateTrackerState({ version: 0, items: [record] });

    expect(migrated.version).toBe(1);
    expect(migrated.order.offer).toEqual(['42']);
  });

  it('applies validated serialized state from another tab', () => {
    const firstStore = createTrackerStore({ storage: new MemoryStorage() });
    const secondStore = createTrackerStore({ storage: new MemoryStorage() });
    firstStore.saveOpportunity(createJob());
    firstStore.setStatus(42, 'applied');

    secondStore.applySerializedState(JSON.stringify(firstStore.getState()));

    expect(secondStore.getState().records['42'].status).toBe('applied');
  });

  it('removes an opportunity completely from records and ordering', () => {
    const store = createTrackerStore({ storage: new MemoryStorage() });
    store.saveOpportunity(createJob({ id: 42 }));
    store.setStatus(42, 'interview');

    expect(store.getState().records['42']).toBeDefined();
    expect(store.getState().order.interview).toContain('42');

    const result = store.removeOpportunity(42);

    expect(result).toBe(true);
    expect(store.getState().records['42']).toBeUndefined();
    expect(store.getState().order.interview).not.toContain('42');
  });

  it('falls back safely when persisted data is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem(trackerStorageKey, '{not-json');

    const store = createTrackerStore({ storage });

    expect(store.getState().records).toEqual({});
  });
});
