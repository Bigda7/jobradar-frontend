import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyJobRadar } from './_proxy';

const validOrigin = 'https://api.example.com';
const validToken = 'a'.repeat(32);

describe.sequential('JobRadar API proxy', () => {
  beforeEach(() => {
    process.env.JOBRADAR_API_ORIGIN = validOrigin;
    process.env.JOBRADAR_API_TOKEN = validToken;
  });

  afterEach(() => {
    delete process.env.JOBRADAR_API_ORIGIN;
    delete process.env.JOBRADAR_API_TOKEN;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('forwards an allowlisted path, query, and server-side bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ items: [] }, { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyJobRadar(
      new Request('https://app.example.com/api/jobs?limit=25&offset=5'),
      '/jobs',
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toBe('https://api.example.com/jobs?limit=25&offset=5');
    expect(options.headers).toEqual({
      Accept: 'application/json',
      Authorization: `Bearer ${validToken}`,
    });
  });

  it('fails closed when server-side configuration is missing', async () => {
    delete process.env.JOBRADAR_API_TOKEN;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyJobRadar(
      new Request('https://app.example.com/api/jobs'),
      '/jobs',
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it('rejects an HTML response instead of passing the SPA shell as API data', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<!doctype html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const response = await proxyJobRadar(
      new Request('https://app.example.com/api/jobs'),
      '/jobs',
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      detail: 'The upstream API returned an invalid response.',
    });
  });

  it('rejects oversized upstream responses before reading the body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{}', {
          status: 200,
          headers: {
            'Content-Length': '10000001',
            'Content-Type': 'application/json',
          },
        }),
      ),
    );

    const response = await proxyJobRadar(
      new Request('https://app.example.com/api/jobs'),
      '/jobs',
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      detail: 'The upstream API response is too large.',
    });
  });
});
