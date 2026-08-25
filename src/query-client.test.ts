import { describe, expect, it } from 'vitest';

import { ApiError } from './api';
import { shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
  it('retries transient network and server failures', () => {
    expect(
      shouldRetryQuery(
        0,
        new ApiError('Network failure', { kind: 'network' }),
      ),
    ).toBe(true);
    expect(
      shouldRetryQuery(
        1,
        new ApiError('Service unavailable', { kind: 'http', status: 503 }),
      ),
    ).toBe(true);
  });

  it('does not retry validation, rate-limit, or contract failures', () => {
    expect(
      shouldRetryQuery(
        0,
        new ApiError('Validation error', { kind: 'http', status: 422 }),
      ),
    ).toBe(false);
    expect(
      shouldRetryQuery(
        0,
        new ApiError('Rate limited', { kind: 'http', status: 429 }),
      ),
    ).toBe(false);
    expect(
      shouldRetryQuery(
        0,
        new ApiError('Invalid response', { kind: 'invalid-response' }),
      ),
    ).toBe(false);
  });
});
