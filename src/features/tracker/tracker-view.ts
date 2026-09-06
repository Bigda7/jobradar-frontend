import type { TrackerRecord, TrackerStatus } from './tracker-schema';

export type TrackerView = 'all' | TrackerStatus;
export type TrackerSort =
  | 'recent_activity'
  | 'oldest_activity'
  | 'vacancy_newest'
  | 'vacancy_oldest';

function timestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function compareNullableDates(
  left: string | null,
  right: string | null,
  direction: 'ascending' | 'descending',
): number {
  const leftTimestamp = timestamp(left);
  const rightTimestamp = timestamp(right);

  if (leftTimestamp === null && rightTimestamp === null) {
    return 0;
  }
  if (leftTimestamp === null) {
    return 1;
  }
  if (rightTimestamp === null) {
    return -1;
  }

  return direction === 'ascending'
    ? leftTimestamp - rightTimestamp
    : rightTimestamp - leftTimestamp;
}

export function sortTrackerRecords(
  records: TrackerRecord[],
  sort: TrackerSort,
): TrackerRecord[] {
  return [...records].sort((left, right) => {
    const comparison =
      sort === 'recent_activity'
        ? compareNullableDates(left.updatedAt, right.updatedAt, 'descending')
        : sort === 'oldest_activity'
          ? compareNullableDates(left.updatedAt, right.updatedAt, 'ascending')
          : sort === 'vacancy_newest'
            ? compareNullableDates(
                left.snapshot.publishedAt,
                right.snapshot.publishedAt,
                'descending',
              )
            : compareNullableDates(
                left.snapshot.publishedAt,
                right.snapshot.publishedAt,
                'ascending',
              );

    if (comparison !== 0) {
      return comparison;
    }

    return right.opportunityId - left.opportunityId;
  });
}
