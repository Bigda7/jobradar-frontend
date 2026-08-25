import { apiRequest } from './client';
import { healthResponseSchema, readinessResponseSchema } from './schemas';
import type { HealthResponse, ReadinessResponse } from './types';

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest('/health', { schema: healthResponseSchema, signal });
}

export function getReadiness(signal?: AbortSignal): Promise<ReadinessResponse> {
  return apiRequest('/ready', { schema: readinessResponseSchema, signal });
}
