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
import { Archive, Columns3, Radar } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '../../components/app-shell';
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
  pipelineStatuses,
  type TrackerRecord,
  type TrackerStatus,
} from './tracker-schema';
import {
  getActiveTrackerCount,
  trackerStore,
  useTrackerState,
} from './tracker-store';

type TrackerView = 'pipeline' | 'archived';

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
  const [view, setView] = useState<TrackerView>('pipeline');
  const initialMobileStatus =
    pipelineStatuses.find((status) => trackerState.order[status].length > 0) ??
    'saved';
  const [mobileStatus, setMobileStatus] =
    useState<TrackerStatus>(initialMobileStatus);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeCount = getActiveTrackerCount(trackerState);
  const archivedRecords = trackerState.order.archived
    .map((id) => trackerState.records[id])
    .filter((record): record is TrackerRecord => Boolean(record));
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
      <main className="flex min-h-[calc(100vh-64px)] min-w-0 bg-canvas lg:h-screen lg:min-h-0">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-white/[0.06] bg-[#121314] px-4 py-5 sm:px-6 lg:px-7">
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

              <div className="flex rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
                <button
                  type="button"
                  onClick={() => setView('pipeline')}
                  aria-pressed={view === 'pipeline'}
                  className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs ${
                    view === 'pipeline'
                      ? 'bg-white/[0.08] text-radar'
                      : 'text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => setView('archived')}
                  aria-pressed={view === 'archived'}
                  className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs ${
                    view === 'archived'
                      ? 'bg-white/[0.08] text-radar'
                      : 'text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archived
                </button>
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
            {activeCount === 0 && archivedRecords.length === 0 ? (
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
                    className="mt-5 inline-flex rounded-xl bg-radar px-4 py-2.5 text-sm font-semibold text-[#15170f]"
                  >
                    Browse matches
                  </Link>
                </div>
              </div>
            ) : view === 'pipeline' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={trackerCollisionDetection}
                onDragStart={handleDragStart}
                onDragCancel={() => setActiveDragId(null)}
                onDragEnd={handleDragEnd}
              >
                <div className="px-4 pt-4 md:hidden">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-700">
                    Pipeline stage
                  </p>
                  <div className="grid grid-cols-2 gap-2" aria-label="Pipeline stage">
                    {pipelineStatuses.map((status) => {
                      const meta = trackerStatusMeta[status];
                      const selected = mobileStatus === status;

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMobileStatus(status)}
                          aria-pressed={selected}
                          className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs transition-colors ${
                            selected
                              ? 'border-radar/35 bg-radar/[0.08] text-radar'
                              : 'border-white/[0.07] bg-white/[0.02] text-zinc-500'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${meta.markerClassName}`} />
                            {meta.label}
                          </span>
                          <span className={selected ? 'text-radar/70' : 'text-zinc-700'}>
                            {trackerState.order[status].length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6 xl:h-full xl:grid-cols-4">
                  {pipelineStatuses.map((status) => {
                    const records = trackerState.order[status]
                      .map((id) => trackerState.records[id])
                      .filter((record): record is TrackerRecord => Boolean(record));

                    return (
                      <TrackerColumn
                        key={getTrackerColumnId(status)}
                        status={status}
                        records={records}
                        onSelect={(record) => setSelectedId(record.opportunityId)}
                        className={status === mobileStatus ? '' : 'hidden md:flex'}
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
            ) : archivedRecords.length > 0 ? (
              <DndContext>
                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 2xl:grid-cols-3">
                  {archivedRecords.map((record) => (
                    <TrackerCard
                      key={getTrackerSortableId(record.opportunityId)}
                      record={record}
                      sortable={false}
                      onSelect={(item) => setSelectedId(item.opportunityId)}
                    />
                  ))}
                </div>
              </DndContext>
            ) : (
              <div className="grid min-h-[420px] place-items-center p-6 text-center text-sm text-zinc-600">
                No archived opportunities.
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
