import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownUp,
  Columns3,
  LayoutList,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  ApiError,
  getMatches,
  queryKeys,
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

interface ScoreTier {
  key: 'top' | 'strong' | 'good' | 'below';
  label: string;
  range: string;
  min: number;
  max: number;
  markerClassName: string;
}

const scoreTiers: ScoreTier[] = [
  {
    key: 'top',
    label: 'Top matches',
    range: '85–100',
    min: 85,
    max: 100,
    markerClassName: 'bg-radar',
  },
  {
    key: 'strong',
    label: 'Strong matches',
    range: '70–84',
    min: 70,
    max: 84,
    markerClassName: 'bg-cyan-300',
  },
  {
    key: 'good',
    label: 'Good fit',
    range: '55–69',
    min: 55,
    max: 69,
    markerClassName: 'bg-violet-300',
  },
  {
    key: 'below',
    label: 'Below target',
    range: '0–54',
    min: 0,
    max: 54,
    markerClassName: 'bg-zinc-500',
  },
];

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

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'network') {
      return 'The API could not be reached. Confirm that the local backend is running.';
    }

    if (error.status === 422) {
      return 'The score filter was rejected by the API.';
    }

    if (error.kind === 'invalid-response') {
      return 'The API response does not match the documented contract.';
    }
  }

  return 'Matches could not be loaded. Try again in a moment.';
}

export function MatchesPage() {
  const [minimumScore, setMinimumScore] = useState(55);
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [tierFocus, setTierFocus] = useState<MatchTierFocus>('all');
  const [sort, setSort] = useState<MatchSort>('score');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const trackerState = useTrackerState();
  const filters = { min_score: minimumScore, limit: pageSize, offset };

  const matchesQuery = useQuery({
    queryKey: queryKeys.matches(filters),
    queryFn: ({ signal }) => getMatches(filters, signal),
    placeholderData: keepPreviousData,
  });

  const items = matchesQuery.data?.items ?? emptyMatches;
  const total = matchesQuery.data?.total;
  const requestedId = Number(searchParams.get('opportunity'));
  const effectiveSelectedId =
    selectedId ?? (Number.isInteger(requestedId) ? requestedId : null);
  const selectedMatch =
    effectiveSelectedId === null
      ? null
      : items.find((item) => item.id === effectiveSelectedId) ?? null;
  const focusedItems = useMemo(
    () => sortLoadedMatches(filterMatchesByTier(items, tierFocus), sort),
    [items, sort, tierFocus],
  );
  const visibleTiers = useMemo(() => {
    if (tierFocus !== 'all') {
      return scoreTiers.filter((tier) => tier.key === tierFocus);
    }

    return scoreTiers.filter((tier) => tier.max >= minimumScore);
  }, [minimumScore, tierFocus]);
  const metrics = useMemo(() => getLoadedMatchMetrics(items), [items]);
  const trackedCount = getActiveTrackerCount(trackerState);
  const rulesVersion = items[0]?.rules_version;
  const hasPreviousPage = offset > 0;
  const hasNextPage = total !== undefined && offset + pageSize < total;

  const selectMinimumScore = (value: number) => {
    setMinimumScore(value);
    setOffset(0);
    setSelectedId(null);
    setTierFocus('all');
  };

  const selectTier = (tier: MatchTierFocus) => {
    const requiredMinimum = tier === 'top' ? 85 : tier === 'strong' ? 70 : 55;

    if (tier !== 'all' && minimumScore > requiredMinimum) {
      setMinimumScore(requiredMinimum);
      setOffset(0);
    }

    setTierFocus(tier);
    setSelectedId(null);
  };

  const openMatch = (match: MatchResponse) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('opportunity');
    setSearchParams(nextParams, { replace: true });
    setSelectedId(match.id);
  };

  const closeMatch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('opportunity');
    setSearchParams(nextParams, { replace: true });
    setSelectedId(null);
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

              <div className="flex flex-wrap items-center gap-2">
                <PremiumSelect
                  value={String(minimumScore)}
                  onValueChange={(value) => selectMinimumScore(Number(value))}
                  options={minimumScoreOptions}
                  label="Minimum match score"
                  leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                  triggerClassName="min-w-36"
                />
                <PremiumSelect
                  value={sort}
                  onValueChange={(value) => setSort(value as MatchSort)}
                  options={sortOptions}
                  label="Sort loaded results"
                  leadingIcon={<ArrowDownUp className="h-3.5 w-3.5" />}
                  triggerClassName="min-w-44"
                />

                <div
                  className="flex rounded-xl border border-white/[0.07] bg-white/[0.025] p-1"
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                  Loaded results
                </span>
                {tierChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => selectTier(chip.value)}
                    aria-pressed={tierFocus === chip.value}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${
                      tierFocus === chip.value
                        ? 'bg-radar text-[#15170f]'
                        : 'border border-white/[0.07] bg-white/[0.025] text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {[
                  ['Top score', metrics.topScore ?? '—'],
                  ['Remote', `${metrics.remotePercentage}%`],
                  ['Salary shown', `${metrics.salaryDisclosedPercentage}%`],
                  ['Tracked', trackedCount],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-20 border-l border-white/[0.05] px-3 py-2 first:border-l-0"
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

            <div className="flex h-9 items-center justify-between border-t border-white/[0.04] px-4 text-[10px] sm:px-6 lg:px-7">
              <span className="text-zinc-700">
                Sort and tier focus apply to the loaded page only.
              </span>
              <span className="max-w-[48vw] truncate text-zinc-700">
                {rulesVersion ? `Rules: ${rulesVersion}` : 'Rules unavailable'}
              </span>
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
                    {getErrorMessage(matchesQuery.error)}
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
              <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-3 p-4 sm:p-5 lg:p-6">
                {visibleTiers.map((tier) => (
                  <div key={tier.key} className="min-w-0">
                    <div className="mb-3 h-5 w-36 animate-pulse rounded bg-white/[0.05]" />
                    <div className="space-y-2.5">
                      {[0, 1, 2].map((item) => (
                        <div
                          key={item}
                          className="h-48 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.025]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="grid min-h-[420px] place-items-center p-6 text-center">
                <div>
                  <h2 className="text-base font-semibold text-zinc-200">
                    No matches at this score
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    Lower the minimum score to widen the result set.
                  </p>
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
              <div className="grid min-w-max grid-flow-col auto-cols-[minmax(288px,1fr)] gap-3 p-4 sm:p-5 lg:min-w-0 lg:p-6">
                {visibleTiers.map((tier) => {
                  const tierItems = focusedItems.filter(
                    (match) => match.score >= tier.min && match.score <= tier.max,
                  );

                  return (
                    <section key={tier.key} className="min-w-0">
                      <div className="mb-3 flex h-7 items-center justify-between gap-3 px-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${tier.markerClassName}`}
                          />
                          <h2 className="truncate text-xs font-semibold text-zinc-300">
                            {tier.label}
                          </h2>
                          <span className="text-[10px] text-zinc-700">
                            {tier.range}
                          </span>
                        </div>
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-500">
                          {tierItems.length} loaded
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {tierItems.length > 0 ? (
                          tierItems.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              isSelected={selectedMatch?.id === match.id}
                              onSelect={openMatch}
                            />
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/[0.07] px-4 py-10 text-center text-xs text-zinc-700">
                            No loaded matches in this tier
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
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
                  onClick={() => setOffset(Math.max(0, offset - pageSize))}
                  className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => setOffset(offset + pageSize)}
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
