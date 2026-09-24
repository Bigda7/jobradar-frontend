import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Archive, ArrowUpDown, Columns3, ListFilter, Radar } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '../../components/app-shell';
import { PremiumSelect } from '../../components/ui/premium-select';
import { TrackerCard, TrackerDragOverlayCard } from './tracker-card';
import { TrackerColumn } from './tracker-column';
import {
  getTrackerColumnId,
  getTrackerSortableId,
  resolveTrackerDropTarget,
  trackerCollisionDetection,
  type TrackerDropData,
} from './tracker-dnd';
import { TrackerDetails } from './tracker-details';
import { trackerStatusMeta } from './tracker-config';
import {
  allTrackerStatuses,
  pipelineStatuses,
  type TrackerRecord,
  type TrackerStatus,
} from './tracker-schema';
import {
  getActiveTrackerCount,
  trackerStore,
  useTrackerState,
} from './tracker-store';
import {
  sortTrackerRecords,
  type TrackerSort,
} from './tracker-view';

const archiveSortOptions = [
  { value: 'recent_activity', label: 'Recently archived' },
  { value: 'oldest_activity', label: 'Oldest archived' },
  { value: 'vacancy_newest', label: 'Vacancy: newest' },
  { value: 'vacancy_oldest', label: 'Vacancy: oldest' },
];

type TrackerMode = 'pipeline' | 'archive';

function getRecordIdFromSortableId(id: string): number | null {
  const prefix = 'tracker-record-';

  if (!id.startsWith(prefix)) {
    return null;
  }

  const parsed = Number(id.slice(prefix.length));
  return Number.isInteger(parsed) ? parsed : null;
}

export function TrackerPage() {
  const trackerState = useTrackerState();
  const initialMobileStage =
    pipelineStatuses.find((status) =>
      trackerState.order[status].some((id) => Boolean(trackerState.records[id])),
    ) ?? 'saved';
  const [mode, setMode] = useState<TrackerMode>('pipeline');
  const [mobileStage, setMobileStage] =
    useState<TrackerStatus>(initialMobileStage);
  const [sort, setSort] = useState<TrackerSort>('recent_activity');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeCount = getActiveTrackerCount(trackerState);
  const recordsByStatus = Object.fromEntries(
    allTrackerStatuses.map((status) => [
      status,
      trackerState.order[status]
        .map((id) => trackerState.records[id])
        .filter((record): record is TrackerRecord => Boolean(record)),
    ]),
  ) as Record<TrackerStatus, TrackerRecord[]>;
  const archivedRecords = recordsByStatus.archived;
  const sortedArchivedRecords = sortTrackerRecords(archivedRecords, sort);
  const totalCount = activeCount + archivedRecords.length;
  const stageOptions = pipelineStatuses.map((status) => ({
    value: status,
    label: `${trackerStatusMeta[status].label} (${recordsByStatus[status].length})`,
  }));
  const selectedRecord =
    selectedId === null
      ? null
      : trackerState.records[String(selectedId)] ?? null;
  const activeDragRecord =
    activeDragId === null
      ? null
      : trackerState.records[String(activeDragId)] ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(getRecordIdFromSortableId(String(event.active.id)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) {
      return;
    }

    const opportunityId = getRecordIdFromSortableId(String(active.id));

    if (opportunityId === null) {
      return;
    }

    const target = resolveTrackerDropTarget(
      over.data.current as TrackerDropData | undefined,
      trackerState.order,
    );

    if (!target) {
      return;
    }

    trackerStore.move(
      opportunityId,
      target.status,
      target.index,
    );
  };

  return (
    <AppShell>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-[calc(100vh-64px)] min-w-0 bg-canvas outline-none lg:h-screen lg:min-h-0"
      >
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-white/[0.06] bg-panel px-4 py-5 sm:px-6 lg:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span>Radar</span>
                  <span>/</span>
                  <span className="text-zinc-400">Local CRM</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-3">
                  <h1 className="text-xl font-semibold tracking-[-0.035em] text-white">
                    Job tracker
                  </h1>
                  <span className="text-xs text-zinc-600">
                    {activeCount} active · {archivedRecords.length} archived
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <div
                  className="grid w-full grid-cols-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 sm:w-auto"
                  aria-label="Tracker view"
                >
                  <button
                    type="button"
                    onClick={() => setMode('pipeline')}
                    aria-pressed={mode === 'pipeline'}
                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors ${
                      mode === 'pipeline'
                        ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                    Pipeline
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('archive')}
                    aria-pressed={mode === 'archive'}
                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors ${
                      mode === 'archive'
                        ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive ({archivedRecords.length})
                  </button>
                </div>
                {mode === 'pipeline' ? (
                  <PremiumSelect
                    value={mobileStage}
                    onValueChange={(value) => setMobileStage(value as TrackerStatus)}
                    options={stageOptions}
                    label="Pipeline stage"
                    leadingIcon={<ListFilter className="h-3.5 w-3.5 text-zinc-500" />}
                    triggerClassName="w-full md:hidden"
                  />
                ) : (
                  <PremiumSelect
                    value={sort}
                    onValueChange={(value) => setSort(value as TrackerSort)}
                    options={archiveSortOptions}
                    label="Sort archived opportunities"
                    leadingIcon={<ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />}
                    triggerClassName="w-full sm:w-48"
                  />
                )}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-zinc-700">
              <span className="md:hidden">
                Stored only in this browser. Use the status menu to move cards.
              </span>
              <span className="hidden md:inline">
                Stored only in this browser. Drag cards or use the status menu.
              </span>
            </p>
          </header>

          <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto">
            {totalCount === 0 ? (
              <div className="grid min-h-[460px] place-items-center p-6 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-radar/15 bg-radar/[0.06] text-radar">
                    <Radar className="h-5 w-5" />
                  </span>
                  <h2 className="mt-5 text-base font-semibold text-zinc-200">
                    Your pipeline is empty
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Save a match or catalog opportunity to start tracking it.
                  </p>
                  <Link
                    to="/matches"
                    className="mt-5 inline-flex rounded-xl bg-radar-fill px-4 py-2.5 text-sm font-semibold text-radar-fill-ink"
                  >
                    Browse matches
                  </Link>
                </div>
              </div>
            ) : mode === 'pipeline' && activeCount > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={trackerCollisionDetection}
                onDragStart={handleDragStart}
                onDragCancel={() => setActiveDragId(null)}
                onDragEnd={handleDragEnd}
              >
                <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6 xl:h-full xl:grid-cols-4">
                  {pipelineStatuses.map((status) => {
                    const records = recordsByStatus[status];

                    return (
                      <TrackerColumn
                        key={getTrackerColumnId(status)}
                        status={status}
                        records={records}
                        onSelect={(record) => setSelectedId(record.opportunityId)}
                        className={status === mobileStage ? '' : 'hidden md:flex'}
                      />
                    );
                  })}
                </div>
                <DragOverlay adjustScale={false} dropAnimation={null}>
                  {activeDragRecord ? (
                    <TrackerDragOverlayCard record={activeDragRecord} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : mode === 'archive' && sortedArchivedRecords.length > 0 ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 2xl:grid-cols-3">
                {sortedArchivedRecords.map((record) => (
                  <TrackerCard
                    key={getTrackerSortableId(record.opportunityId)}
                    record={record}
                    sortable={false}
                    onSelect={(item) => setSelectedId(item.opportunityId)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center p-6 text-center text-sm text-zinc-600">
                {mode === 'pipeline'
                  ? 'No opportunities in the active pipeline.'
                  : 'No archived opportunities.'}
              </div>
            )}
          </div>
        </section>

        {selectedRecord ? (
          <TrackerDetails
            key={selectedRecord.opportunityId}
            record={selectedRecord}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </main>
    </AppShell>
  );
}
