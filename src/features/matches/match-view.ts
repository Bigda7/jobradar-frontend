import type { MatchResponse } from '../../api';

export type MatchTierFocus = 'all' | 'top' | 'strong' | 'good';
export type MatchSort = 'score' | 'newest' | 'company';

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
      return right.score - left.score;
    }

    if (sort === 'newest') {
      const leftDate = left.published_at
        ? Date.parse(left.published_at)
        : Number.NEGATIVE_INFINITY;
      const rightDate = right.published_at
        ? Date.parse(right.published_at)
        : Number.NEGATIVE_INFINITY;
      return rightDate - leftDate;
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
