import type { JobsFilters, MatchFilters } from './types';

export const queryKeys = {
  jobs: (filters: JobsFilters) => ['jobs', filters] as const,
  matches: (filters: MatchFilters) => ['matches', filters] as const,
  sources: () => ['sources'] as const,
  readiness: () => ['ready'] as const,
};
