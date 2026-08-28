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
  const matchedSkills = match.matched_skills.slice(0, 4);
  const tags = [
    formatLabel(match.work_mode),
    match.employment_type ? formatLabel(match.employment_type) : null,
    salary,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <article
      onClick={() => onSelect(match)}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          onSelect(match);
        }
      }}
      tabIndex={0}
      aria-label={`Open details for ${match.title}`}
      className={`group w-full cursor-pointer text-left transition-all ${
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
            {match.source_display_name}
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

        <h3 className="mt-2 line-clamp-2 break-words text-[15px] font-semibold leading-5 text-zinc-100">
          {match.title}
        </h3>

        {match.company ? (
          <p className="mt-1 truncate text-xs text-zinc-500">{match.company}</p>
        ) : null}

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

        {matchedSkills.length > 0 && !compact ? (
          <p className="mt-3 truncate text-xs leading-5 text-zinc-500">
            <span className="font-medium text-zinc-400">Why it matches:</span>{' '}
            {matchedSkills.join(' · ')}
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
            <span className="grid h-7 w-7 place-items-center rounded-lg group-hover:bg-white/[0.05]">
              <ChevronRight className="h-4 w-4 text-zinc-700 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
            </span>
          ) : null}
        </div>
      </div>

      {compact ? (
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="rounded-full bg-radar px-2.5 py-1 text-xs font-bold text-[#15170f]">
            {match.score}%
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07]">
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </span>
        </div>
      ) : null}
    </article>
  );
}
