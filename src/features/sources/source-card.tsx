import {
  AlertTriangle,
  Check,
  Clock3,
  Power,
  RadioTower,
} from 'lucide-react';

import type { SourceResponse } from '../../api';
import {
  formatLabel,
  formatRelativeDate,
} from '../matches/formatters';

interface SourceCardProps {
  source: SourceResponse;
}

const absoluteDateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatAbsoluteDate(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? undefined
    : absoluteDateFormatter.format(timestamp);
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <article className="flex min-h-72 flex-col rounded-2xl border border-white/[0.07] bg-card p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400">
            <RadioTower className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-zinc-100">
              {source.display_name}
            </h2>
            <p className="mt-1 truncate text-[11px] text-zinc-600">
              {source.name}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            source.enabled
              ? 'bg-radar text-[#15170f]'
              : 'bg-zinc-700 text-zinc-300'
          }`}
        >
          <Power className="h-3 w-3" />
          {source.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </header>

      <div className="mt-5">
        <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
          {formatLabel(source.opportunity_kind)}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
            <Clock3 className="h-3.5 w-3.5" />
            Last run
          </dt>
          <dd
            className="mt-2 text-xs text-zinc-300"
            title={formatAbsoluteDate(source.last_run_at)}
          >
            {formatRelativeDate(source.last_run_at, 'Never')}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
            <Check className="h-3.5 w-3.5" />
            Last success
          </dt>
          <dd
            className="mt-2 text-xs text-zinc-300"
            title={formatAbsoluteDate(source.last_success_at)}
          >
            {formatRelativeDate(source.last_success_at, 'Never')}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        {source.last_error ? (
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.055] p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Last reported error
            </div>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-amber-100/65">
              {source.last_error}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 text-xs text-zinc-700">
            No error reported
          </div>
        )}
      </div>
    </article>
  );
}
