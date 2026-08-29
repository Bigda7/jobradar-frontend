import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  getApiErrorMessage,
  getJobs,
  queryKeys,
  type WorkMode,
} from '../../api';
import { AppShell } from '../../components/app-shell';
import { PremiumSelect } from '../../components/ui/premium-select';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { JobCard } from './job-card';
import { createJobsFilters } from './job-filters';

const pageSize = 50;
const debounceDelay = 350;

const workModes: { label: string; value: WorkMode }[] = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'On-site', value: 'onsite' },
  { label: 'Flexible', value: 'flexible' },
  { label: 'Unknown', value: 'unknown' },
];

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [workMode, setWorkMode] = useState<WorkMode>('remote');
  const [employmentType, setEmploymentType] = useState('');
  const [minimumSalary, setMinimumSalary] = useState('');
  const [offset, setOffset] = useState(0);
  const debouncedSearch = useDebouncedValue(search, debounceDelay);
  const debouncedEmploymentType = useDebouncedValue(
    employmentType,
    debounceDelay,
  );
  const debouncedMinimumSalary = useDebouncedValue(
    minimumSalary,
    debounceDelay,
  );

  const filters = useMemo(
    () =>
      createJobsFilters({
        search: debouncedSearch,
        workMode,
        employmentType: debouncedEmploymentType,
        minimumSalary: debouncedMinimumSalary,
        limit: pageSize,
        offset,
      }),
    [
      debouncedEmploymentType,
      debouncedMinimumSalary,
      debouncedSearch,
      offset,
      workMode,
    ],
  );

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs(filters),
    queryFn: ({ signal }) => getJobs(filters, signal),
    placeholderData: keepPreviousData,
  });

  const jobs = jobsQuery.data?.items ?? [];
  const total = jobsQuery.data?.total;
  const hasPreviousPage = offset > 0;
  const hasNextPage = total !== undefined && offset + pageSize < total;
  const lastOffset =
    total === undefined || total === 0
      ? 0
      : Math.floor((total - 1) / pageSize) * pageSize;
  const isOffsetOutOfRange = total !== undefined && offset > lastOffset;
  const searchNeedsMoreCharacters =
    search.trim().length > 0 && search.trim().length < 2;

  const resetFilters = () => {
    setSearch('');
    setWorkMode('remote');
    setEmploymentType('');
    setMinimumSalary('');
    setOffset(0);
  };

  return (
    <AppShell>
      <main className="flex min-h-[calc(100vh-64px)] min-w-0 flex-col bg-canvas lg:h-screen lg:min-h-0">
        <header className="shrink-0 border-b border-white/[0.06] bg-[#121314] px-4 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span>Radar</span>
                <span>/</span>
                <span className="text-zinc-400">Explore</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-3">
                <h1 className="text-xl font-semibold tracking-[-0.035em] text-white">
                  All jobs
                </h1>
                {total !== undefined ? (
                  <span className="text-xs text-zinc-600">{total} results</span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset filters
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_minmax(150px,0.8fr)_minmax(170px,1fr)_minmax(150px,0.75fr)]">
            <label className="relative block">
              <span className="sr-only">Search jobs</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOffset(0);
                }}
                placeholder="Search title, company, description"
                className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] pl-10 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-radar/40 focus:ring-2 focus:ring-radar/10"
              />
            </label>

            <PremiumSelect
              value={workMode}
              onValueChange={(value) => {
                setWorkMode(value as WorkMode);
                setOffset(0);
              }}
              options={workModes}
              label="Work mode"
              triggerClassName="h-11 w-full text-sm"
            />

            <label>
              <span className="sr-only">Employment type</span>
              <input
                type="text"
                value={employmentType}
                onChange={(event) => {
                  setEmploymentType(event.target.value);
                  setOffset(0);
                }}
                placeholder="Employment type, e.g. full_time"
                className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-radar/40 focus:ring-2 focus:ring-radar/10"
              />
            </label>

            <label>
              <span className="sr-only">Minimum salary</span>
              <input
                type="number"
                min="0"
                step="any"
                value={minimumSalary}
                onChange={(event) => {
                  setMinimumSalary(event.target.value);
                  setOffset(0);
                }}
                placeholder="Min salary"
                className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-radar/40 focus:ring-2 focus:ring-radar/10"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-zinc-700">
              Work mode is explicit; Remote matches the backend default.
            </span>
            <span
              className={
                searchNeedsMoreCharacters ? 'text-amber-300' : 'text-zinc-700'
              }
            >
              {searchNeedsMoreCharacters
                ? 'Enter at least 2 characters to search.'
                : 'Search updates after 350 ms.'}
            </span>
          </div>
        </header>

        <div className="premium-scrollbar min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto">
          {jobsQuery.isError ? (
            <div className="grid min-h-[420px] place-items-center p-6">
              <div className="max-w-md rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-7 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-rose-300" />
                <h2 className="mt-4 text-base font-semibold text-zinc-100">
                  Unable to load jobs
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {getApiErrorMessage(jobsQuery.error, {
                      resource: 'Jobs',
                      validationMessage:
                        'One or more filters were rejected by the API.',
                    })}
                </p>
                <button
                  type="button"
                  onClick={() => jobsQuery.refetch()}
                  className="mt-5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.07]"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : jobsQuery.isPending ? (
            <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-3 p-4 sm:p-6 xl:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-60 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="grid min-h-[420px] place-items-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold text-zinc-200">
                  No jobs match these filters
                </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    {isOffsetOutOfRange
                      ? 'The result set changed and this page no longer exists.'
                      : 'Try another work mode or clear one of the text filters.'}
                  </p>
                  {isOffsetOutOfRange ? (
                    <button
                      type="button"
                      onClick={() => setOffset(lastOffset)}
                      className="mt-5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.07]"
                    >
                      Open last available page
                    </button>
                  ) : null}
              </div>
            </div>
          ) : (
            <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-3 p-4 sm:p-6 xl:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {total !== undefined ? (
          <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#121314] px-4 py-3 text-xs sm:px-6">
            <span className="text-zinc-600">
              {total === 0
                ? '0 results'
                : `${offset + 1}–${Math.min(offset + pageSize, total)} of ${total}`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!hasPreviousPage}
                aria-label="Previous jobs page"
                onClick={() => setOffset(Math.max(0, offset - pageSize))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!hasNextPage || jobsQuery.isPlaceholderData}
                aria-label="Next jobs page"
                onClick={() => setOffset(offset + pageSize)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        ) : null}
      </main>
    </AppShell>
  );
}
