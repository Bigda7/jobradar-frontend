import { useId } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  X,
} from 'lucide-react';

import type { MatchResponse } from '../../api';
import { useDrawerAccessibility } from '../../hooks/use-drawer-accessibility';
import { isSafeExternalUrl } from '../../security/external-url';
import { TrackerStatusControl } from '../tracker/tracker-status-control';
import { formatLabel, formatRelativeDate, formatSalary } from './formatters';

interface MatchDetailsProps {
  match: MatchResponse;
  onClose: () => void;
}

export function MatchDetails({ match, onClose }: MatchDetailsProps) {
  const salary = formatSalary(match);
  const titleId = useId();
  const { closeButtonRef, isModal, panelRef } =
    useDrawerAccessibility(onClose);
  const sourceUrl = isSafeExternalUrl(match.source_url)
    ? match.source_url
    : null;

  return (
    <>
      {isModal ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-[1px]"
        />
      ) : null}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={isModal || undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-white/[0.08] bg-panel shadow-[-24px_0_80px_rgb(0_0_0/35%)] outline-none sm:max-w-[480px] xl:static xl:z-auto xl:max-w-[430px] xl:shrink-0 xl:shadow-none"
      >
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        <div>
          <span className="text-xs font-medium text-zinc-500">Match details</span>
          <span className="mt-1 block text-[11px] text-zinc-700">
            {formatRelativeDate(match.published_at)}
          </span>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close match details"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] text-zinc-500 hover:bg-white/[0.05] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{match.source_display_name}</span>
            </div>
            <h2 id={titleId} className="mt-3 break-words text-2xl font-semibold leading-8 tracking-[-0.035em] text-white">
              {match.title}
            </h2>
            {match.company ? (
              <p className="mt-2 text-sm text-zinc-500">{match.company}</p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-xl bg-radar-fill px-3 py-2 text-sm font-bold text-radar-fill-ink">
            {match.score}%
          </span>
        </div>

        <div className="mt-5">
          <TrackerStatusControl opportunity={match} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-300">
            {formatLabel(match.work_mode)}
          </span>
          {match.employment_type ? (
            <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-300">
              {formatLabel(match.employment_type)}
            </span>
          ) : null}
          {salary ? (
            <span className="rounded-full border border-amber-200/10 bg-amber-200/90 px-2.5 py-1.5 text-xs font-medium text-amber-950">
              {salary}
            </span>
          ) : null}
        </div>

        {match.location_text ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
            <MapPin className="h-4 w-4" />
            <span>{match.location_text}</span>
          </div>
        ) : null}

        <section className="mt-7 border-t border-white/[0.07] pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Why it matches
          </h3>
          {match.reasons.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {match.reasons.map((reason) => (
                <li
                  key={reason}
                  className="flex gap-3 text-sm leading-6 text-zinc-300"
                >
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-radar" />
                  <span className="min-w-0 break-words">{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-600">No reasons provided.</p>
          )}
        </section>

        <section className="mt-7 border-t border-white/[0.07] pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Concerns
          </h3>
          {match.concerns.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {match.concerns.map((concern) => (
                <li
                  key={concern}
                  className="flex gap-3 text-sm leading-6 text-zinc-300"
                >
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                  <span className="min-w-0 break-words">{concern}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-600">No concerns provided.</p>
          )}
        </section>

        <section className="mt-7 border-t border-white/[0.07] pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Description
          </h3>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-400">
            {match.description ?? 'No description provided by the source.'}
          </p>
        </section>

      </div>

        {sourceUrl ? (
          <div className="shrink-0 border-t border-white/[0.07] bg-panel p-4">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-radar-fill px-4 py-3 text-sm font-semibold text-radar-fill-ink transition-colors hover:bg-radar-fill-hover"
            >
              Open vacancy
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : null}
      </aside>
    </>
  );
}
