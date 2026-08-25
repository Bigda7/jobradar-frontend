import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical, StickyNote } from 'lucide-react';

import { formatLabel, formatRelativeDate } from '../matches/formatters';
import type { TrackerRecord } from './tracker-schema';
import { formatTrackerSalary } from './tracker-formatters';
import { TrackerRecordStatusSelect } from './tracker-record-status-select';
import { getTrackerSortableId } from './tracker-dnd';

interface TrackerCardProps {
  record: TrackerRecord;
  onSelect: (record: TrackerRecord) => void;
  sortable?: boolean;
}

export function TrackerCard({
  record,
  onSelect,
  sortable = true,
}: TrackerCardProps) {
  const sortableState = useSortable({
    id: getTrackerSortableId(record.opportunityId),
    disabled: !sortable,
    data: {
      type: 'tracker-record',
      opportunityId: record.opportunityId,
      status: record.status,
    },
  });
  const salary = formatTrackerSalary(record.snapshot);
  const style = {
    transform: CSS.Transform.toString(sortableState.transform),
    transition: sortableState.transition,
  };

  return (
    <article
      ref={sortableState.setNodeRef}
      style={style}
      className={`rounded-xl border bg-card p-4 shadow-sm shadow-black/10 transition-colors ${
        sortableState.isDragging
          ? 'z-20 border-radar/45 opacity-65'
          : 'border-white/[0.07] hover:border-white/[0.12]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(record)}
          className="min-w-0 flex-1 text-left outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-radar/40"
        >
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-600">
            {record.snapshot.company ?? 'Company not specified'}
          </span>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">
            {record.snapshot.title}
          </h3>
        </button>
        {sortable ? (
          <button
            type="button"
            ref={sortableState.setActivatorNodeRef}
            {...sortableState.attributes}
            {...sortableState.listeners}
            className="grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-lg border border-white/[0.06] text-zinc-700 hover:bg-white/[0.04] hover:text-zinc-400 active:cursor-grabbing"
            aria-label={`Drag ${record.snapshot.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-cyan-200/90 px-2 py-1 text-[10px] font-medium text-cyan-950">
          {formatLabel(record.snapshot.workMode)}
        </span>
        {salary ? (
          <span className="max-w-full truncate rounded-full bg-amber-200/90 px-2 py-1 text-[10px] font-medium text-amber-950">
            {salary}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <TrackerRecordStatusSelect record={record} compact />
      </div>

      <footer className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-zinc-700">
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {formatRelativeDate(record.snapshot.publishedAt)}
          </span>
        </span>
        {record.notes ? (
          <span
            className="flex items-center gap-1 text-radar/70"
            aria-label="Has notes"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Note
          </span>
        ) : null}
      </footer>
    </article>
  );
}
