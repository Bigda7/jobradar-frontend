import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/client';

export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.kind === 'network') {
    return failureCount < 2;
  }

  return (
    error.kind === 'http' &&
    error.status !== undefined &&
    error.status >= 500 &&
    failureCount < 2
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
  },
});
