import {
  closestCorners,
  pointerWithin,
  rectIntersection,
  type Collision,
  type CollisionDetection,
} from '@dnd-kit/core';

import type { TrackerState, TrackerStatus } from './tracker-schema';

export interface TrackerDropData {
  status?: TrackerStatus;
  opportunityId?: number;
}

export interface TrackerDropTarget {
  status: Exclude<TrackerStatus, 'archived'>;
  index: number;
}

export function getTrackerSortableId(opportunityId: number): string {
  return `tracker-record-${opportunityId}`;
}

export function getTrackerColumnId(status: TrackerStatus): string {
  return `tracker-column-${status}`;
}

export function resolveTrackerDropTarget(
  data: TrackerDropData | undefined,
  order: TrackerState['order'],
): TrackerDropTarget | null {
  const status = data?.status;

  if (!status || status === 'archived') {
    return null;
  }

  const targetOrder = order[status];
  const targetOpportunityId = data.opportunityId;
  const targetIndex =
    targetOpportunityId === undefined
      ? targetOrder.length
      : targetOrder.indexOf(String(targetOpportunityId));

  return {
    status,
    index: targetIndex < 0 ? targetOrder.length : targetIndex,
  };
}

function collisionsForType(
  collisions: Collision[],
  args: Parameters<CollisionDetection>[0],
  type: 'tracker-record' | 'tracker-column',
): Collision[] {
  return collisions.filter(
    (collision) =>
      args.droppableContainers.find(
        (container) => container.id === collision.id,
      )?.data.current?.type === type,
  );
}

export const trackerCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const directCollisions =
    pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
  const recordCollisions = collisionsForType(
    directCollisions,
    args,
    'tracker-record',
  );

  if (recordCollisions.length > 0) {
    return recordCollisions;
  }

  const columnCollisions = collisionsForType(
    directCollisions,
    args,
    'tracker-column',
  );

  return columnCollisions.length > 0 ? columnCollisions : closestCorners(args);
};
