import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownUp,
  Columns3,
  LayoutList,
  RadioTower,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  getApiErrorMessage,
  getMatches,
  getSources,
  queryKeys,
  type MatchFilters,
  type MatchResponse,
} from '../../api';
import { AppShell } from '../../components/app-shell';
import { PremiumSelect } from '../../components/ui/premium-select';
import {
  getActiveTrackerCount,
  useTrackerState,
} from '../tracker/tracker-store';
import { MatchCard } from './match-card';
import { MatchDetails } from './match-details';
import {
  filterMatchesByTier,
  getLoadedMatchMetrics,
  sortLoadedMatches,
  type MatchSort,
  type MatchTierFocus,
} from './match-view';

type ViewMode = 'board' | 'list';

const minimumScoreOptions = [
  { value: '0', label: 'All scores' },
  { value: '55', label: '55 and above' },
  { value: '70', label: '70 and above' },
  { value: '85', label: '85 and above' },
];

const sortOptions = [
  { value: 'score', label: 'Score: high to low' },
  { value: 'newest', label: 'Publication: newest' },
  { value: 'company', label: 'Company: A to Z' },
];

const tierChips: { value: MatchTierFocus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'top', label: 'Top 85+' },
  { value: 'strong', label: 'Strong 70–84' },
  { value: 'good', label: 'Good 55–69' },
];

const pageSize = 50;
const emptyMatches: MatchResponse[] = [];
const allSourcesValue = 'all';

export function MatchesPage() {
  const [minimumScore, setMinimumScore] = useState(55);
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [tierFocus, setTierFocus] = useState<MatchTierFocus>('all');
  const [sort, setSort] = useState<MatchSort>('score');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const trackerState = useTrackerState();
  const selectedSource = searchParams.get('source') ?? allSourcesValue;
  const filters: MatchFilters = {
    min_score: minimumScore,
    limit: pageSize,
    offset,
    ...(selectedSource !== allSourcesValue
      ? { source: selectedSource }
      : {}),
  };

  const sourcesQuery = useQuery({
    queryKey: queryKeys.sources(),
    queryFn: ({ signal }) => getSources(signal),
  });

  const matchesQuery = useQuery({
    queryKey: queryKeys.matches(filters),
    queryFn: ({ signal }) => getMatches(filters, signal),
    placeholderData: (previousData, previousQuery) => {
      const previousFilters = previousQuery?.queryKey[1] as
        | MatchFilters
        | undefined;

      return previousFilters?.source === filters.source &&
        previousFilters?.min_score === filters.min_score
        ? previousData
        : undefined;
    },
  });

  const items = matchesQuery.data?.items ?? emptyMatches;
  const total = matchesQuery.data?.total;
  const requestedOpportunity = searchParams.get('opportunity');
  const requestedId =
    requestedOpportunity && /^\d+$/.test(requestedOpportunity)
      ? Number(requestedOpportunity)
      : null;
  const effectiveSelectedId =
    selectedId ?? requestedId;
  const selectedMatch =
    effectiveSelectedId === null
      ? null
      : items.find((item) => item.id === effectiveSelectedId) ?? null;
  const focusedItems = useMemo(
    () => sortLoadedMatches(filterMatchesByTier(items, tierFocus), sort),
    [items, sort, tierFocus],
  );
  const metrics = useMemo(() => getLoadedMatchMetrics(items), [items]);
  const trackedCount = getActiveTrackerCount(trackerState);
  const rulesVersion = items[0]?.rules_version;
  const sourceOptions = useMemo(() => {
    const options = [
      { value: allSourcesValue, label: 'All platforms' },
      ...(sourcesQuery.data ?? [])
        .filter((source) => source.enabled)
        .sort((left, right) =>
          left.display_name.localeCompare(right.display_name),
        )
        .map((source) => ({
          value: source.name,
          label: source.display_name,
        })),
    ];

    if (!options.some((option) => option.value === selectedSource)) {
      options.push({ value: selectedSource, label: selectedSource });
    }

    return options;
  }, [selectedSource, sourcesQuery.data]);
  const hasPreviousPage = offset > 0;
  const hasNextPage = total !== undefined && offset + pageSize < total;
  const lastOffset =
    total === undefined || total === 0
      ? 0
      : Math.floor((total - 1) / pageSize) * pageSize;
  const isOffsetOutOfRange = total !== undefined && offset > lastOffset;

  const clearSelection = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('opportunity');
    setSearchParams(nextParams, { replace: true });
    setSelectedId(null);
  }, [searchParams, setSearchParams]);

  const selectMinimumScore = (value: number) => {
    setMinimumScore(value);
    setOffset(0);
    setTierFocus('all');
    clearSelection();
  };

  const selectSource = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('opportunity');

    if (value === allSourcesValue) {
      nextParams.delete('source');
    } else {
      nextParams.set('source', value);
    }

    setSearchParams(nextParams, { replace: true });
    setOffset(0);
    setTierFocus('all');
    setSelectedId(null);
  };

  const selectTier = (tier: MatchTierFocus) => {
    const requiredMinimum = tier === 'top' ? 85 : tier === 'strong' ? 70 : 55;

    if (tier !== 'all' && minimumScore > requiredMinimum) {
      setMinimumScore(requiredMinimum);
      setOffset(0);
    }

    setTierFocus(tier);
    clearSelection();
  };

  const openMatch = (match: MatchResponse) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('opportunity', String(match.id));
    setSearchParams(nextParams, { replace: true });
    setSelectedId(match.id);
  };

  const closeMatch = clearSelection;

  const openPreviousPage = () => {
    setOffset(Math.max(0, offset - pageSize));
    clearSelection();
  };

  const openNextPage = () => {
    setOffset(offset + pageSize);
    clearSelection();
  };

  return (
    <AppShell matchCount={total}>
      <main className="flex min-h-[calc(100vh-64px)] min-w-0 bg-canvas lg:h-screen lg:min-h-0">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-white/[0.06] bg-[#121314]">
            <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-7">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span>Radar</span>
                  <span>/</span>
                  <span className="text-zinc-400">Top matches</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-3">
                  <h1 className="text-xl font-semibold tracking-[-0.035em] text-white">
                    Match board
                  </h1>
                  {total !== undefined ? (
                    <span className="text-xs text-zinc-600">{total} total</span>
                  ) : null}
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                <PremiumSelect
                  value={selectedSource}
                  onValueChange={selectSource}
                  options={sourceOptions}
                  label="Job platform"
                  leadingIcon={<RadioTower className="h-3.5 w-3.5" />}
                  triggerClassName="col-span-2 w-full sm:w-auto sm:min-w-40"
                />
                <PremiumSelect
                  value={String(minimumScore)}
                  onValueChange={(value) => selectMinimumScore(Number(value))}
                  options={minimumScoreOptions}
                  label="Minimum match score"
                  leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                  triggerClassName="w-full min-w-0 sm:w-auto sm:min-w-36"
                />
                <PremiumSelect
                  value={sort}
                  onValueChange={(value) => setSort(value as MatchSort)}
                  options={sortOptions}
                  label="Sort loaded results"
                  leadingIcon={<ArrowDownUp className="h-3.5 w-3.5" />}
                  triggerClassName="w-full min-w-0 sm:w-auto sm:min-w-44"
                />

                <div
                  className="col-span-2 flex w-fit rounded-xl border border-white/[0.07] bg-white/[0.025] p-1"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('board')}
                    aria-label="Board view"
                    aria-pressed={viewMode === 'board'}
                    className={`grid h-8 w-8 place-items-center rounded-lg ${
                      viewMode === 'board'
                        ? 'bg-white/[0.08] text-radar'
                        : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <Columns3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="Compact list view"
                    aria-pressed={viewMode === 'list'}
                    className={`grid h-8 w-8 place-items-center rounded-lg ${
                      viewMode === 'list'
                        ? 'bg-white/[0.08] text-radar'
                        : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.04] px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between lg:px-7">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700 sm:mr-1">
                  Loaded results
                </span>
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                  {tierChips.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => selectTier(chip.value)}
                      aria-pressed={tierFocus === chip.value}
                      className={`w-full rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors sm:w-auto ${
                        tierFocus === chip.value
                          ? 'bg-radar text-[#15170f]'
                          : 'border border-white/[0.07] bg-white/[0.025] text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] sm:w-auto sm:grid-cols-4">
                {[
                  ['Top score', metrics.topScore ?? '—'],
                  ['Remote', `${metrics.remotePercentage}%`],
                  ['Salary shown', `${metrics.salaryDisclosedPercentage}%`],
                  ['Tracked', trackedCount],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 border-l border-white/[0.05] px-3 py-2 first:border-l-0"
                  >
                    <span className="block text-[9px] uppercase tracking-[0.09em] text-zinc-700">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-zinc-300">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] px-4 py-1.5 text-[10px] sm:px-6 lg:px-7">
              <div className="flex flex-wrap items-center gap-3 text-zinc-700">
                <span>
                  Platform and minimum score apply to all results. Sort and tier
                  focus apply to the loaded page only.
                </span>
                {total !== undefined && total > 0 ? (
                  <span className="font-medium text-zinc-500">
                    Showing {offset + 1}–{Math.min(offset + pageSize, total)} of {total}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {total !== undefined && total > pageSize ? (
                  <>
                    <button
                      type="button"
                      disabled={!hasPreviousPage}
                      onClick={openPreviousPage}
                      className="rounded-md border border-white/[0.07] px-2 py-1 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!hasNextPage || matchesQuery.isPlaceholderData}
                      onClick={openNextPage}
                      className="rounded-md border border-white/[0.07] px-2 py-1 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Next
                    </button>
                  </>
                ) : null}
                <span className="max-w-[36vw] truncate text-zinc-700">
                  {rulesVersion ? `Rules: ${rulesVersion}` : 'Rules unavailable'}
                </span>
              </div>
            </div>
          </header>

          <div className="premium-scrollbar min-h-0 flex-1 overflow-auto">
            {matchesQuery.isError ? (
              <div className="grid min-h-[420px] place-items-center p-6">
                <div className="max-w-md rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-7 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-rose-300" />
                  <h2 className="mt-4 text-base font-semibold text-zinc-100">
                    Unable to load matches
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {getApiErrorMessage(matchesQuery.error, {
                      resource: 'Matches',
                      validationMessage:
                        'The score filter was rejected by the API.',
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => matchesQuery.refetch()}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.07]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </div>
              </div>
            ) : matchesQuery.isPending ? (
              <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 md:grid-cols-2 lg:p-6 2xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-48 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.025]"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="grid min-h-[420px] place-items-center p-6 text-center">
                <div>
                  <h2 className="text-base font-semibold text-zinc-200">
                    No matches at this score
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    {isOffsetOutOfRange
                      ? 'The result set changed and this page no longer exists.'
                      : 'Lower the minimum score to widen the result set.'}
                  </p>
                  {isOffsetOutOfRange ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOffset(lastOffset);
                        clearSelection();
                      }}
                      className="mt-5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.07]"
                    >
                      Open last available page
                    </button>
                  ) : null}
                </div>
              </div>
            ) : focusedItems.length === 0 ? (
              <div className="grid min-h-[420px] place-items-center p-6 text-center">
                <div>
                  <h2 className="text-base font-semibold text-zinc-200">
                    No loaded matches in this tier
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    Choose All or load another results page.
                  </p>
                </div>
              </div>
            ) : viewMode === 'board' ? (
              <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 md:grid-cols-2 lg:p-6 2xl:grid-cols-3">
                {focusedItems.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isSelected={selectedMatch?.id === match.id}
                    onSelect={openMatch}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-5xl space-y-2 p-4 sm:p-5 lg:p-6">
                {focusedItems.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    compact
                    isSelected={selectedMatch?.id === match.id}
                    onSelect={openMatch}
                  />
                ))}
              </div>
            )}
          </div>

          {total !== undefined && total > pageSize ? (
            <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#121314] px-4 py-3 text-xs sm:px-6">
              <span className="text-zinc-600">
                {offset + 1}–{Math.min(offset + pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!hasPreviousPage}
                  onClick={openPreviousPage}
                  className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasNextPage || matchesQuery.isPlaceholderData}
                  onClick={openNextPage}
                  className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </footer>
          ) : null}
        </section>

        {selectedMatch ? (
          <MatchDetails match={selectedMatch} onClose={closeMatch} />
        ) : null}
      </main>
    </AppShell>
  );
}
