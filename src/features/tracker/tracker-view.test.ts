import { describe, expect, it } from 'vitest';

import type { TrackerRecord } from './tracker-schema';
import { sortTrackerRecords } from './tracker-view';

function createRecord(
  opportunityId: number,
  updatedAt: string,
  publishedAt: string | null,
): TrackerRecord {
  return {
    opportunityId,
    status: 'saved',
    notes: '',
    snapshot: {
      title: `Opportunity ${opportunityId}`,
      company: null,
      kind: 'employment',
      workMode: 'remote',
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      publishedAt,
    },
    createdAt: updatedAt,
    updatedAt,
  };
}

describe('tracker record sorting', () => {
  const records = [
    createRecord(1, '2026-08-20T10:00:00Z', '2026-08-24T10:00:00Z'),
    createRecord(2, '2026-08-22T10:00:00Z', null),
    createRecord(3, '2026-08-21T10:00:00Z', '2026-08-25T10:00:00Z'),
  ];

  it('sorts by recent and oldest tracker activity', () => {
    expect(
      sortTrackerRecords(records, 'recent_activity').map(
        (record) => record.opportunityId,
      ),
    ).toEqual([2, 3, 1]);
    expect(
      sortTrackerRecords(records, 'oldest_activity').map(
        (record) => record.opportunityId,
      ),
    ).toEqual([1, 3, 2]);
  });

  it('sorts unavailable vacancy dates last in both directions', () => {
    expect(
      sortTrackerRecords(records, 'vacancy_newest').map(
        (record) => record.opportunityId,
      ),
    ).toEqual([3, 1, 2]);
    expect(
      sortTrackerRecords(records, 'vacancy_oldest').map(
        (record) => record.opportunityId,
      ),
    ).toEqual([1, 3, 2]);
  });

  it('does not mutate the stored order', () => {
    const original = [...records];

    sortTrackerRecords(records, 'recent_activity');

    expect(records).toEqual(original);
  });
});
