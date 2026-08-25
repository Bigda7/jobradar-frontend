import { CalendarDays, ChevronRight } from 'lucide-react';

import type { MatchResponse } from '../../api';
import { TrackerStatusControl } from '../tracker/tracker-status-control';
import { formatLabel, formatRelativeDate, formatSalary } from './formatters';

interface MatchCardProps {
  match: MatchResponse;
  isSelected: boolean;
  onSelect: (match: MatchResponse) => void;
  compact?: boolean;
}

export function MatchCard({
  match,
  isSelected,
  onSelect,
  compact = false,
}: MatchCardProps) {
  const salary = formatSalary(match);
  const preview = match.reasons[0] ?? match.concerns[0] ?? null;
  const tags = [
    formatLabel(match.work_mode),
    match.employment_type ? formatLabel(match.employment_type) : null,
    salary,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <article
      className={`group w-full text-left transition-all ${
        compact
          ? 'grid gap-4 rounded-xl border px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'
          : 'rounded-xl border p-4'
      } ${
        isSelected
          ? 'border-radar/45 bg-radar/[0.055] shadow-[0_0_0_1px_rgb(163_230_53/8%)]'
          : 'border-white/[0.07] bg-card hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-[#292a2d]'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            {match.company ?? 'Company not specified'}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {!compact ? (
              <span className="rounded-full bg-radar px-2 py-1 text-[11px] font-bold text-[#15170f]">
                {match.score}%
              </span>
            ) : null}
            <TrackerStatusControl opportunity={match} compact />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(match)}
          className="mt-2 block w-full text-left outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-radar/40"
        >
          <h3 className="line-clamp-2 break-words text-[15px] font-semibold leading-5 text-zinc-100">
            {match.title}
          </h3>
        </button>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={`max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-medium ${
                index === 0
                  ? 'border-cyan-200/10 bg-cyan-200/90 text-cyan-950'
                  : index === 1
                    ? 'border-violet-200/10 bg-violet-200/90 text-violet-950'
                    : 'border-amber-200/10 bg-amber-200/90 text-amber-950'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {preview && !compact ? (
          <p className="mt-3 line-clamp-2 break-words text-xs leading-5 text-zinc-500">
            {preview}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-zinc-600">
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatRelativeDate(match.published_at)}
            </span>
          </span>
          {!compact ? (
            <button
              type="button"
              onClick={() => onSelect(match)}
              aria-label={`Open details for ${match.title}`}
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/[0.05]"
            >
              <ChevronRight className="h-4 w-4 text-zinc-700 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
            </button>
          ) : null}
        </div>
      </div>

      {compact ? (
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="rounded-full bg-radar px-2.5 py-1 text-xs font-bold text-[#15170f]">
            {match.score}%
          </span>
          <button
            type="button"
            onClick={() => onSelect(match)}
            aria-label={`Open details for ${match.title}`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07]"
          >
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </button>
        </div>
      ) : null}
    </article>
  );
}
