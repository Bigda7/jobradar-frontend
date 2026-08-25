import { ExternalLink, Save, StickyNote, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { formatLabel, formatRelativeDate } from '../matches/formatters';
import { formatTrackerSalary } from './tracker-formatters';
import { TrackerRecordStatusSelect } from './tracker-record-status-select';
import type { TrackerRecord } from './tracker-schema';
import { trackerStore } from './tracker-store';

interface TrackerDetailsProps {
  record: TrackerRecord;
  onClose: () => void;
}

export function TrackerDetails({ record, onClose }: TrackerDetailsProps) {
  const [notes, setNotes] = useState(record.notes);
  const debouncedNotes = useDebouncedValue(notes, 500);
  const salary = formatTrackerSalary(record.snapshot);
  const isSaving = notes !== record.notes;

  useEffect(() => {
    if (debouncedNotes !== record.notes) {
      trackerStore.setNotes(record.opportunityId, debouncedNotes);
    }
  }, [debouncedNotes, record.notes, record.opportunityId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-white/[0.08] bg-[#151617] shadow-[-24px_0_80px_rgb(0_0_0/35%)] sm:max-w-[480px] xl:static xl:z-auto xl:max-w-[430px] xl:shrink-0 xl:shadow-none">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        <div>
          <span className="text-xs font-medium text-zinc-400">
            Tracker record
          </span>
          <span className="mt-1 block text-[11px] text-zinc-700">
            Local to this browser
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tracker details"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] text-zinc-500 hover:bg-white/[0.05] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-zinc-600">
          {record.snapshot.company ?? 'Company not specified'}
        </p>
        <h2 className="mt-3 text-2xl font-semibold leading-8 tracking-[-0.035em] text-white">
          {record.snapshot.title}
        </h2>

        <div className="mt-5">
          <TrackerRecordStatusSelect record={record} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-cyan-200/90 px-2.5 py-1 text-[10px] font-medium text-cyan-950">
            {formatLabel(record.snapshot.workMode)}
          </span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-400">
            {formatLabel(record.snapshot.kind)}
          </span>
          {salary ? (
            <span className="rounded-full bg-amber-200/90 px-2.5 py-1 text-[10px] font-medium text-amber-950">
              {salary}
            </span>
          ) : null}
        </div>

        <div className="mt-5 text-xs text-zinc-600">
          Published {formatRelativeDate(record.snapshot.publishedAt)}
        </div>

        <section className="mt-7 border-t border-white/[0.07] pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.11em] text-zinc-500">
              <StickyNote className="h-4 w-4" />
              Personal notes
            </h3>
            <span
              role="status"
              className={`flex items-center gap-1.5 text-[10px] ${
                isSaving ? 'text-amber-300' : 'text-zinc-600'
              }`}
            >
              <Save className="h-3 w-3" />
              {isSaving ? 'Saving…' : 'Saved locally'}
            </span>
          </div>
          <textarea
            value={notes}
            maxLength={5_000}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            rows={10}
            placeholder="Interview details, contacts, follow-up dates, or anything worth remembering."
            className="premium-scrollbar mt-4 w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-radar/40 focus:ring-2 focus:ring-radar/10"
          />
          <p className="mt-2 text-right text-[10px] text-zinc-700">
            {notes.length} / 5000
          </p>
        </section>

        <div className="mt-7 border-t border-white/[0.07] pt-5 text-[10px] text-zinc-700">
          Updated {formatRelativeDate(record.updatedAt)}
        </div>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-white/[0.07] p-4">
        {record.snapshot.sourceUrl ? (
          <a
            href={record.snapshot.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-radar px-4 py-3 text-sm font-semibold text-[#15170f] hover:bg-lime-300"
          >
            Open vacancy
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => {
            trackerStore.removeOpportunity(record.opportunityId);
            onClose();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-zinc-400 hover:border-rose-400/30 hover:bg-rose-400/[0.08] hover:text-rose-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove from tracker
        </button>
      </footer>
    </aside>
  );
}
