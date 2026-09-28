import { CalendarDays, Clock3 } from 'lucide-react';

import { formatRelativeDate } from '../matches/formatters';
import { formatTrackerPlatform } from './tracker-formatters';
import { TrackerRecordStatusSelect } from './tracker-record-status-select';
import type { TrackerRecord } from './tracker-schema';

interface TrackerTableProps {
  records: TrackerRecord[];
  onSelect: (record: TrackerRecord) => void;
}

export function TrackerTable({ records, onSelect }: TrackerTableProps) {
  return (
    <>
      <div className="divide-y divide-white/[0.05] md:hidden">
        {records.map((record) => (
          <article
            key={record.opportunityId}
            className="relative cursor-pointer px-4 py-4 transition-colors hover:bg-white/[0.025] focus-within:bg-white/[0.035] focus-within:ring-2 focus-within:ring-inset focus-within:ring-radar/20"
          >
            <button
              type="button"
              onClick={() => onSelect(record)}
              aria-label={`Open details for ${record.snapshot.title}`}
              className="absolute inset-0 z-10 focus-visible:outline-none"
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-600">
                  {formatTrackerPlatform(record.snapshot)}
                </span>
                <h2 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">
                  {record.snapshot.title}
                </h2>
                {record.snapshot.company ? (
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {record.snapshot.company}
                  </p>
                ) : null}
              </div>
              <div className="relative z-20">
                <TrackerRecordStatusSelect record={record} compact />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Vacancy {formatRelativeDate(record.snapshot.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                Updated {formatRelativeDate(record.updatedAt)}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-panel text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-700">
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3">Platform</th>
              <th className="px-4 py-3">Vacancy</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Vacancy date</th>
              <th className="px-6 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {records.map((record) => (
              <tr
                key={record.opportunityId}
                onClick={() => onSelect(record)}
                className="cursor-pointer transition-colors hover:bg-white/[0.025] focus-within:bg-white/[0.035]"
              >
                <td className="max-w-40 px-6 py-4 align-middle">
                  <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-zinc-500">
                    {formatTrackerPlatform(record.snapshot)}
                  </span>
                </td>
                <td className="max-w-md px-4 py-4 align-middle">
                  <h2 className="truncate text-sm font-semibold text-zinc-100">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(record);
                      }}
                      aria-label={`Open details for ${record.snapshot.title}`}
                      className="max-w-full truncate text-left hover:text-radar focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radar/70"
                    >
                      {record.snapshot.title}
                    </button>
                  </h2>
                  {record.snapshot.company ? (
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {record.snapshot.company}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-middle">
                  <TrackerRecordStatusSelect record={record} compact />
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-middle text-xs text-zinc-500">
                  {formatRelativeDate(record.snapshot.publishedAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 align-middle text-xs text-zinc-500">
                  {formatRelativeDate(record.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
