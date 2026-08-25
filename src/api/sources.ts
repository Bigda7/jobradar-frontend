import { apiRequest } from './client';
import { sourceListResponseSchema } from './schemas';
import type { SourceResponse } from './types';

export function getSources(signal?: AbortSignal): Promise<SourceResponse[]> {
  return apiRequest('/sources', {
    schema: sourceListResponseSchema,
    signal,
  });
}
