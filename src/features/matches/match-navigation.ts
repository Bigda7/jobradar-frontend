import type { MatchFilters } from '../../api';
import type { MatchSort, MatchTierFocus } from './match-view';

const defaultMinimumScore = 55;
const maximumOffset = 100_000;

function readInteger(
  value: string | null,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (value === null || !/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

export function readMatchPageOptions(params: URLSearchParams): {
  minimumScore: number;
  offset: number;
  sort: MatchSort;
  tierFocus: MatchTierFocus;
} {
  const requestedSort = params.get('sort');
  const requestedTier = params.get('tier');
  return {
    minimumScore: readInteger(params.get('min_score'), 0, 100, defaultMinimumScore),
    offset: readInteger(params.get('offset'), 0, maximumOffset, 0),
    sort:
      requestedSort === 'newest' || requestedSort === 'company'
        ? requestedSort
        : 'score',
    tierFocus:
      requestedTier === 'top' || requestedTier === 'strong' || requestedTier === 'good'
        ? requestedTier
        : 'all',
  };
}

export function createMatchRoute(id: number, filters: MatchFilters): string {
  const params = new URLSearchParams();
  params.set('opportunity', String(id));
  params.set('min_score', String(filters.min_score ?? defaultMinimumScore));
  params.set('sort', filters.sort ?? 'score');
  params.set('offset', String(filters.offset ?? 0));
  if (filters.source) {
    params.set('source', filters.source);
  }
  return `/matches?${params.toString()}`;
}
