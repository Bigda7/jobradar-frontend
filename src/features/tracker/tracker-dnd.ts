import type { TrackerStatus } from './tracker-schema';

export function getTrackerSortableId(opportunityId: number): string {
  return `tracker-record-${opportunityId}`;
}

export function getTrackerColumnId(status: TrackerStatus): string {
  return `tracker-column-${status}`;
}
