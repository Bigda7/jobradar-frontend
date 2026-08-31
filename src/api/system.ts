import { apiRequest } from './client';
import { healthResponseSchema } from './schemas';
import type { HealthResponse } from './types';

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest('/health', { schema: healthResponseSchema, signal });
}
