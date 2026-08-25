import { CalendarDays, MapPin } from 'lucide-react';

import type { JobResponse } from '../../api';
import {
  formatLabel,
  formatRelativeDate,
  formatSalary,
} from '../matches/formatters';
import { TrackerStatusControl } from '../tracker/tracker-status-control';

interface JobCardProps {
  job: JobResponse;
}

export function JobCard({ job }: JobCardProps) {
  const salary = formatSalary(job);

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-card p-5 transition-colors hover:border-white/[0.12] hover:bg-[#292a2d]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.09em] text-zinc-500">
            {job.company ?? 'Company not specified'}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-6 tracking-[-0.025em] text-zinc-100">
            {job.title}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="w-fit rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
            {formatLabel(job.kind)}
          </span>
          <TrackerStatusControl opportunity={job} compact />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-cyan-200/90 px-2.5 py-1 text-[10px] font-medium text-cyan-950">
          {formatLabel(job.work_mode)}
        </span>
        {job.employment_type ? (
          <span className="rounded-full bg-violet-200/90 px-2.5 py-1 text-[10px] font-medium text-violet-950">
            {formatLabel(job.employment_type)}
          </span>
        ) : null}
        {salary ? (
          <span className="rounded-full bg-amber-200/90 px-2.5 py-1 text-[10px] font-medium text-amber-950">
            {salary}
          </span>
        ) : null}
      </div>

      {job.description ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-500">
          {job.description}
        </p>
      ) : (
        <p className="mt-4 text-sm text-zinc-700">
          No description provided by the source.
        </p>
      )}

      <footer className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 text-[11px] text-zinc-600">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatRelativeDate(job.published_at, 'Publish date unavailable')}
        </span>
        {job.location_text ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{job.location_text}</span>
          </span>
        ) : null}
      </footer>
    </article>
  );
}
