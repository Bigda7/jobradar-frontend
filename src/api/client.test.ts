import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, apiRequest } from './client';

const responseSchema = z.object({ status: z.literal('ok') });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('builds a relative API URL and validates the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiRequest('/health', {
      schema: responseSchema,
      query: { limit: 20, empty: undefined },
    });

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/health?limit=20',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('exposes FastAPI validation details for a 422 response', async () => {
    const details = {
      detail: [
        {
          type: 'less_than_equal',
          loc: ['query', 'limit'],
          msg: 'Input should be less than or equal to 200',
          input: '500',
          ctx: { le: 200 },
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(details), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const error = await apiRequest('/jobs', { schema: responseSchema }).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'http', status: 422 });
    expect((error as ApiError).validationError).toEqual(details);
  });

  it('rejects successful responses that violate the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 'unexpected' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(
      apiRequest('/health', { schema: responseSchema }),
    ).rejects.toMatchObject({ kind: 'invalid-response', status: 200 });
  });
});
