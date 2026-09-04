import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { trackerStatusMeta } from './tracker-config';
import { TrackerCard } from './tracker-card';
import { getTrackerColumnId, getTrackerSortableId } from './tracker-dnd';
import type { TrackerRecord, TrackerStatus } from './tracker-schema';

interface TrackerColumnProps {
  status: TrackerStatus;
  records: TrackerRecord[];
  onSelect: (record: TrackerRecord) => void;
  className?: string;
}

export function TrackerColumn({
  status,
  records,
  onSelect,
  className = '',
}: TrackerColumnProps) {
  const droppable = useDroppable({
    id: getTrackerColumnId(status),
    data: { type: 'tracker-column', status },
  });
  const meta = trackerStatusMeta[status];

  return (
    <section className={`min-w-0 md:flex md:min-h-0 md:flex-col ${className}`}>
      <header className="mb-3 flex h-10 shrink-0 items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.markerClassName}`} />
            <h2 className="text-xs font-semibold text-zinc-200">{meta.label}</h2>
            <span className="rounded-full bg-white/[0.045] px-2 py-0.5 text-[10px] text-zinc-500">
              {records.length}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-zinc-700">{meta.description}</p>
        </div>
      </header>

      <SortableContext
        items={records.map((record) =>
          getTrackerSortableId(record.opportunityId),
        )}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={droppable.setNodeRef}
          className={`premium-scrollbar space-y-2.5 rounded-2xl border p-2 transition-colors ${
            records.length > 0
              ? 'min-h-28 md:min-h-0 md:flex-1 md:overflow-y-auto'
              : 'min-h-28 md:min-h-0'
          } ${
            droppable.isOver
              ? 'border-radar/25 bg-radar/[0.035]'
              : 'border-white/[0.045] bg-white/[0.018]'
          }`}
        >
          {records.length > 0 ? (
            records.map((record) => (
              <TrackerCard
                key={record.opportunityId}
                record={record}
                onSelect={onSelect}
              />
            ))
          ) : (
            <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-white/[0.06] px-4 text-center text-[11px] text-zinc-700">
              Move an opportunity here
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
