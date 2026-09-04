import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical, StickyNote } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, ReactNode, Ref } from 'react';

import { formatLabel, formatRelativeDate } from '../matches/formatters';
import type { TrackerRecord } from './tracker-schema';
import { trackerStatusMeta } from './tracker-config';
import { formatTrackerSalary } from './tracker-formatters';
import { TrackerRecordStatusSelect } from './tracker-record-status-select';
import { getTrackerSortableId } from './tracker-dnd';

interface TrackerCardProps {
  record: TrackerRecord;
  onSelect: (record: TrackerRecord) => void;
  sortable?: boolean;
}

interface TrackerCardContentProps {
  record: TrackerRecord;
  onSelect?: (record: TrackerRecord) => void;
  dragHandle?: ReactNode;
  nodeRef?: Ref<HTMLElement>;
  style?: CSSProperties;
  dragging?: boolean;
  overlay?: boolean;
}

function TrackerCardContent({
  record,
  onSelect,
  dragHandle,
  nodeRef,
  style,
  dragging = false,
  overlay = false,
}: TrackerCardContentProps) {
  const salary = formatTrackerSalary(record.snapshot);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      onSelect &&
      event.target === event.currentTarget &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      onSelect(record);
    }
  };

  return (
    <article
      ref={nodeRef}
      style={style}
      onClick={onSelect ? () => onSelect(record) : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `Open details for ${record.snapshot.title}` : undefined}
      className={`rounded-xl border bg-card p-4 outline-none transition-colors ${
        overlay
          ? 'border-radar/45 shadow-2xl shadow-black/45'
          : 'shadow-sm shadow-black/10'
      } ${
        dragging
          ? 'border-radar/25 opacity-20'
          : overlay
            ? ''
            : 'cursor-pointer border-white/[0.07] hover:border-white/[0.12] hover:bg-[#292a2d] focus-visible:border-radar/45 focus-visible:ring-2 focus-visible:ring-radar/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-600">
            {record.snapshot.company ?? 'Company not specified'}
          </span>
          <h3 className="mt-2 line-clamp-2 break-words text-sm font-semibold leading-5 text-zinc-100">
            {record.snapshot.title}
          </h3>
        </div>
        {dragHandle}
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
        {overlay ? (
          <span className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-zinc-400">
            {trackerStatusMeta[record.status].label}
          </span>
        ) : (
          <TrackerRecordStatusSelect record={record} compact />
        )}
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
  const style = {
    transform: sortableState.isDragging
      ? undefined
      : CSS.Transform.toString(sortableState.transform),
    transition: sortableState.isDragging
      ? undefined
      : sortableState.transition,
  };

  return (
    <TrackerCardContent
      record={record}
      onSelect={onSelect}
      nodeRef={sortableState.setNodeRef}
      style={style}
      dragging={sortableState.isDragging}
      dragHandle={
        sortable ? (
          <span
            className="hidden md:block"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              ref={sortableState.setActivatorNodeRef}
              {...sortableState.attributes}
              {...sortableState.listeners}
              className="grid h-8 w-8 shrink-0 touch-none cursor-grab place-items-center rounded-lg border border-white/[0.06] text-zinc-700 hover:bg-white/[0.04] hover:text-zinc-400 active:cursor-grabbing"
              aria-label={`Drag ${record.snapshot.title}`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </span>
        ) : undefined
      }
    />
  );
}

export function TrackerDragOverlayCard({ record }: { record: TrackerRecord }) {
  return (
    <div aria-hidden="true">
      <TrackerCardContent
        record={record}
        overlay
        dragHandle={
          <span className="grid h-8 w-8 shrink-0 cursor-grabbing place-items-center rounded-lg border border-radar/20 text-radar/70">
            <GripVertical className="h-4 w-4" />
          </span>
        }
      />
    </div>
  );
}
