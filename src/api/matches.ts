import { apiRequest } from './client';
import { matchListResponseSchema } from './schemas';
import type { MatchFilters, MatchListResponse } from './types';

export function getMatches(
  filters: MatchFilters = {},
  signal?: AbortSignal,
): Promise<MatchListResponse> {
  return apiRequest('/matches', {
    schema: matchListResponseSchema,
    query: filters,
    signal,
  });
}
