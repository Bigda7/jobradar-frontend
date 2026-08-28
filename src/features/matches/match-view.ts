import type { MatchResponse } from '../../api';

export type MatchTierFocus = 'all' | 'top' | 'strong' | 'good';
export type MatchSort = 'score' | 'newest' | 'company';

function publishedTimestamp(item: MatchResponse): number {
  if (!item.published_at) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(item.published_at);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function comparePublishedNewest(
  left: MatchResponse,
  right: MatchResponse,
): number {
  return publishedTimestamp(right) - publishedTimestamp(left);
}

export function filterMatchesByTier(
  items: MatchResponse[],
  focus: MatchTierFocus,
): MatchResponse[] {
  if (focus === 'all') {
    return items;
  }

  const ranges = {
    top: [85, 100],
    strong: [70, 84],
    good: [55, 69],
  } as const;
  const [minimum, maximum] = ranges[focus];

  return items.filter(
    (item) => item.score >= minimum && item.score <= maximum,
  );
}

export function sortLoadedMatches(
  items: MatchResponse[],
  sort: MatchSort,
): MatchResponse[] {
  return [...items].sort((left, right) => {
    if (sort === 'score') {
      return right.score - left.score || comparePublishedNewest(left, right);
    }

    if (sort === 'newest') {
      return comparePublishedNewest(left, right);
    }

    return (left.company ?? '\uffff').localeCompare(right.company ?? '\uffff');
  });
}

export function getLoadedMatchMetrics(items: MatchResponse[]) {
  const count = items.length;
  const remoteCount = items.filter((item) => item.work_mode === 'remote').length;
  const salaryCount = items.filter(
    (item) => item.salary_min !== null || item.salary_max !== null,
  ).length;

  return {
    topScore: count > 0 ? Math.max(...items.map((item) => item.score)) : null,
    remotePercentage: count > 0 ? Math.round((remoteCount / count) * 100) : 0,
    salaryDisclosedPercentage:
      count > 0 ? Math.round((salaryCount / count) * 100) : 0,
  };
}
