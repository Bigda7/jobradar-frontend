import { describe, expect, it } from 'vitest';

import { createEmptyTrackerState } from './tracker-schema';
import { resolveTrackerDropTarget } from './tracker-dnd';

describe('tracker drop target resolution', () => {
  const order = createEmptyTrackerState().order;
  order.saved = ['1', '2'];
  order.applied = ['3', '4'];

  it('targets the hovered record position', () => {
    expect(
      resolveTrackerDropTarget(
        { status: 'applied', opportunityId: 4 },
        order,
      ),
    ).toEqual({ status: 'applied', index: 1 });
  });

  it('targets the end when hovering a column or an unknown record', () => {
    expect(resolveTrackerDropTarget({ status: 'saved' }, order)).toEqual({
      status: 'saved',
      index: 2,
    });
    expect(
      resolveTrackerDropTarget(
        { status: 'saved', opportunityId: 999 },
        order,
      ),
    ).toEqual({ status: 'saved', index: 2 });
  });

  it('rejects missing and archived targets', () => {
    expect(resolveTrackerDropTarget(undefined, order)).toBeNull();
    expect(resolveTrackerDropTarget({ status: 'archived' }, order)).toBeNull();
  });
});
