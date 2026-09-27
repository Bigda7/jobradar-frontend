import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JobResponse, MatchResponse } from '../../api';
import {
  migrateTrackerState,
  trackerStorageKey,
  type TrackerRecord,
} from './tracker-schema';
import {
  createTrackerStore,
  startTrackerStorageSync,
  type TrackerStorage,
} from './tracker-store';

afterEach(() => {
  vi.unstubAllGlobals();
});

class MemoryStorage implements TrackerStorage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

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
    source_url: 'https://example.com/job/42',
    source_name: 'example',
    source_display_name: 'Example Jobs',
    ...overrides,
  };
}

function createMatch(overrides: Partial<MatchResponse> = {}): MatchResponse {
  return {
    ...createJob(),
    score: 88,
    reasons: [],
    concerns: [],
    matched_skills: [],
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
      snapshot: {
        sourceName: 'example',
        sourceDisplayName: 'Example Jobs',
      },
    });
    expect(createTrackerStore({ storage }).getState().records['42'].snapshot.title).toBe(
      'Frontend Developer',
    );
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

  it('refreshes validated data from another tab', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    const secondStore = createTrackerStore({ storage });
    firstStore.saveOpportunity(createJob());
    firstStore.setStatus(42, 'applied');

    secondStore.refreshFromStorage();

    expect(secondStore.getState().records['42'].status).toBe('applied');
  });

  it('keeps independent saves made by stale tabs', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    const secondStore = createTrackerStore({ storage });

    firstStore.saveOpportunity(createJob({ id: 1 }));
    secondStore.saveOpportunity(createJob({ id: 2 }));

    const reloadedStore = createTrackerStore({ storage });
    expect(Object.keys(reloadedStore.getState().records).sort()).toEqual([
      '1',
      '2',
    ]);
  });

  it('keeps independent fields changed by stale tabs', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    firstStore.saveOpportunity(createJob());
    const secondStore = createTrackerStore({ storage });

    firstStore.setStatus(42, 'interview');
    secondStore.setNotes(42, 'Call recruiter');

    const record = createTrackerStore({ storage }).getState().records['42'];
    expect(record.status).toBe('interview');
    expect(record.notes).toBe('Call recruiter');
  });

  it('uses the last saved value when tabs edit the same field', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    firstStore.saveOpportunity(createJob());
    const secondStore = createTrackerStore({ storage });

    firstStore.setNotes(42, 'First note');
    secondStore.setNotes(42, 'Second note');

    expect(createTrackerStore({ storage }).getState().records['42'].notes).toBe(
      'Second note',
    );
  });

  it('preserves separate status changes from stale tabs', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    firstStore.saveOpportunity(createJob({ id: 1 }));
    firstStore.saveOpportunity(createJob({ id: 2 }));
    const secondStore = createTrackerStore({ storage });

    firstStore.setStatus(1, 'interview');
    secondStore.setStatus(2, 'applied');

    const reloaded = createTrackerStore({ storage }).getState();
    expect(reloaded.order.interview).toEqual(['1']);
    expect(reloaded.order.applied).toEqual(['2']);
  });

  it('does not restore a deleted record from a stale tab', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    firstStore.saveOpportunity(createJob());
    const secondStore = createTrackerStore({ storage });

    firstStore.removeOpportunity(42);
    expect(secondStore.setNotes(42, 'Stale edit')).toBe(false);
    expect(createTrackerStore({ storage }).getState().records['42']).toBeUndefined();
  });

  it('keeps a deletion over the legacy snapshot after reload', () => {
    const storage = new MemoryStorage();
    const original = createTrackerStore({ storage: new MemoryStorage() });
    original.saveOpportunity(createJob());
    storage.setItem(trackerStorageKey, JSON.stringify(original.getState()));
    const store = createTrackerStore({ storage });

    store.removeOpportunity(42);

    expect(createTrackerStore({ storage }).getState().records['42']).toBeUndefined();
    expect(storage.getItem(trackerStorageKey)).toContain('Frontend Developer');
  });

  it('can explicitly save a record again after deletion', () => {
    const storage = new MemoryStorage();
    const store = createTrackerStore({ storage });
    store.saveOpportunity(createJob());
    store.setNotes(42, 'Old note');
    store.removeOpportunity(42);

    store.saveOpportunity(createJob());

    const record = createTrackerStore({ storage }).getState().records['42'];
    expect(record.status).toBe('saved');
    expect(record.notes).toBe('');
  });

  it('reloads the latest storage rather than a delayed serialized event', () => {
    const storage = new MemoryStorage();
    const firstStore = createTrackerStore({ storage });
    const secondStore = createTrackerStore({ storage });
    firstStore.saveOpportunity(createJob({ id: 1 }));
    const delayedState = JSON.stringify(firstStore.getState());
    secondStore.saveOpportunity(createJob({ id: 2 }));
    const addEventListener = vi.fn();
    vi.stubGlobal('window', {
      localStorage: storage,
      addEventListener,
      removeEventListener: vi.fn(),
    });
    const stop = startTrackerStorageSync(secondStore);
    const handler = addEventListener.mock.calls[0][1] as (event: StorageEvent) => void;

    handler({
      key: trackerStorageKey,
      newValue: delayedState,
      storageArea: storage,
    } as unknown as StorageEvent);
    stop();

    expect(Object.keys(secondStore.getState().records).sort()).toEqual(['1', '2']);
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

  it('does not crash when storage access throws', () => {
    const storage: TrackerStorage = {
      length: 0,
      getItem: () => {
        throw new Error('Storage is blocked');
      },
      key: () => null,
      setItem: () => {
        throw new Error('Storage is blocked');
      },
    };

    const store = createTrackerStore({ storage });

    expect(store.getState().records).toEqual({});
    expect(store.getPersistenceError()).toContain('could not be saved');
    expect(() => store.saveOpportunity(createJob())).not.toThrow();
    expect(store.getState().records['42']).toBeDefined();
    expect(store.getPersistenceError()).toContain('could not be saved');
  });

  it('clears a previous persistence error after a successful write', () => {
    const values = new Map<string, string>();
    let shouldFail = true;
    const storage: TrackerStorage = {
      get length() {
        return values.size;
      },
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      setItem: (key, value) => {
        if (shouldFail) {
          throw new Error('Storage is temporarily blocked');
        }
        values.set(key, value);
      },
    };
    const store = createTrackerStore({ storage });

    store.saveOpportunity(createJob());
    expect(store.getPersistenceError()).toContain('could not be saved');

    shouldFail = false;
    store.setNotes(42, 'Follow up tomorrow');

    expect(store.getPersistenceError()).toBeNull();
    expect(createTrackerStore({ storage }).getState().records['42'].notes).toBe(
      'Follow up tomorrow',
    );
  });

  it('removes an unsafe stored URL while preserving the tracker record', () => {
    const sourceStore = createTrackerStore({
      storage: new MemoryStorage(),
      now: () => '2026-08-25T12:00:00Z',
    });
    sourceStore.saveOpportunity(createMatch());
    const serialized = structuredClone(sourceStore.getState());
    serialized.records['42'].snapshot.sourceUrl = 'javascript:alert(1)';
    const storage = new MemoryStorage();
    storage.setItem(trackerStorageKey, JSON.stringify(serialized));

    const recoveredStore = createTrackerStore({ storage });

    expect(recoveredStore.getState().records['42']).toBeDefined();
    expect(recoveredStore.getState().records['42'].snapshot.sourceUrl).toBeUndefined();
  });

  it('salvages valid records when another stored record is invalid', () => {
    const sourceStore = createTrackerStore({
      storage: new MemoryStorage(),
      now: () => '2026-08-25T12:00:00Z',
    });
    sourceStore.saveOpportunity(createJob({ id: 1 }));
    sourceStore.saveOpportunity(createJob({ id: 2 }));
    const serialized = structuredClone(sourceStore.getState());
    serialized.records['2'].notes = 'x'.repeat(5_001);
    const storage = new MemoryStorage();
    storage.setItem(trackerStorageKey, JSON.stringify(serialized));

    const recoveredStore = createTrackerStore({ storage });

    expect(recoveredStore.getState().records['1']).toBeDefined();
    expect(recoveredStore.getState().records['2']).toBeUndefined();
  });

  it('returns a cleanup function for cross-tab storage synchronization', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', {
      localStorage: new MemoryStorage(),
      addEventListener,
      removeEventListener,
    });

    const stop = startTrackerStorageSync(
      createTrackerStore({ storage: new MemoryStorage() }),
    );
    const handler = addEventListener.mock.calls[0][1];

    expect(addEventListener).toHaveBeenCalledWith('storage', handler);
    stop();
    expect(removeEventListener).toHaveBeenCalledWith('storage', handler);
  });
});
