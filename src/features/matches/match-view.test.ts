import { describe, expect, it } from 'vitest';

import type { MatchResponse } from '../../api';
import {
  filterMatchesByTier,
  getLoadedMatchMetrics,
  sortLoadedMatches,
} from './match-view';

function createMatch(
  id: number,
  score: number,
  overrides: Partial<MatchResponse> = {},
): MatchResponse {
  return {
    id,
    kind: 'employment',
    status: 'active',
    title: `Job ${id}`,
    company: `Company ${id}`,
    description: null,
    location_text: null,
    work_mode: 'remote',
    employment_type: null,
    contract_type: null,
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    salary_period: null,
    published_at: null,
    first_seen_at: '2026-08-25T10:00:00Z',
    last_seen_at: '2026-08-25T10:00:00Z',
    source_url: 'https://example.com/job',
    source_name: 'example',
    source_display_name: 'Example Jobs',
    score,
    reasons: [],
    concerns: [],
    matched_skills: [],
    rules_version: 'test',
    ...overrides,
  };
}

describe('match view helpers', () => {
  const items = [
    createMatch(1, 90, { company: 'Zeta' }),
    createMatch(2, 78, { company: 'Alpha', work_mode: 'hybrid' }),
    createMatch(3, 60, { salary_max: '2000.00' }),
  ];

  it('focuses exact loaded score tiers', () => {
    expect(filterMatchesByTier(items, 'strong').map((item) => item.id)).toEqual([
      2,
    ]);
  });

  it('sorts only the provided loaded items', () => {
    expect(sortLoadedMatches(items, 'company').map((item) => item.id)).toEqual([
      2, 3, 1,
    ]);
  });

  it('uses publication date to order equal scores', () => {
    const equalScores = [
      createMatch(1, 80, { published_at: '2026-08-20T10:00:00Z' }),
      createMatch(2, 80, { published_at: '2026-08-25T10:00:00Z' }),
      createMatch(3, 90, { published_at: '2026-08-10T10:00:00Z' }),
    ];

    expect(
      sortLoadedMatches(equalScores, 'score').map((item) => item.id),
    ).toEqual([3, 2, 1]);
  });

  it('calculates metrics from the loaded sample', () => {
    expect(getLoadedMatchMetrics(items)).toEqual({
      topScore: 90,
      remotePercentage: 67,
      salaryDisclosedPercentage: 33,
    });
  });
});
