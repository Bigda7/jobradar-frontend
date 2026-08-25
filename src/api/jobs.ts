import { apiRequest } from './client';
import { jobListResponseSchema } from './schemas';
import type { JobListResponse, JobsFilters } from './types';

export function getJobs(
  filters: JobsFilters = {},
  signal?: AbortSignal,
): Promise<JobListResponse> {
  return apiRequest('/jobs', {
    schema: jobListResponseSchema,
    query: filters,
    signal,
  });
}
