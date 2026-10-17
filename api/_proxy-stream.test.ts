import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyJobRadar } from './_proxy';

const limit = 10_000_000;
const requestUrl = 'https://app.example.com/api/jobs';

function upstreamStream(chunks: Uint8Array[], headers: HeadersInit = {}, status = 200) {
  let delivered = 0;
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        const chunk = chunks[delivered];
        if (chunk) {
          delivered += 1;
          controller.enqueue(chunk);
        } else {
          controller.close();
        }
      },
      cancel,
    },
    { highWaterMark: 0 },
  );
  const responseHeaders = new Headers(headers);
  if (!responseHeaders.has('Content-Type')) responseHeaders.set('Content-Type', 'application/json');
  const response = new Response(body, { status, headers: responseHeaders });
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return { response, cancel, delivered: () => delivered, fetchMock };
}

describe.sequential('bounded JobRadar proxy responses', () => {
  beforeEach(() => {
    vi.stubEnv('JOBRADAR_API_ORIGIN', 'https://api.example.com');
    vi.stubEnv('JOBRADAR_API_TOKEN', 'a'.repeat(32));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([undefined, '1', 'invalid', '-1'])(
    'stops after the limit with content-length %s', async (declaredLength) => {
      const headers = new Headers();
      if (declaredLength !== undefined) headers.set('Content-Length', declaredLength);
      const fixture = upstreamStream([
        new Uint8Array(limit), new Uint8Array(1), new Uint8Array(1_000_000),
      ], headers);
      const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ detail: 'The upstream API response is too large.' });
      expect(fixture.delivered()).toBe(2);
      expect(fixture.cancel).toHaveBeenCalledTimes(1);
      const options = fixture.fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect(options.signal?.aborted).toBe(true);
      expect(fixture.response.body?.locked).toBe(false);
    });

  it.each([new Headers(), new Headers({ 'Content-Encoding': 'gzip', 'Content-Length': '20' })])(
    'counts actual decoded bytes with headers %j', async (headers) => {
      const fixture = upstreamStream([new Uint8Array(limit + 1), new Uint8Array(1)], headers);
      const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
      expect(response.status).toBe(502);
      expect(fixture.delivered()).toBe(1);
      expect(fixture.cancel).toHaveBeenCalledOnce();
    });

  it('cancels an oversized declared response without reading it', async () => {
    const fixture = upstreamStream([new Uint8Array(1)], { 'Content-Length': `${limit + 1}` });
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(502);
    expect(fixture.delivered()).toBe(0);
    expect(fixture.cancel).toHaveBeenCalledOnce();
  });

  it.each([200, 503])('rejects HTML at status %s before reading it', async (status) => {
    const fixture = upstreamStream([new Uint8Array(1)], { 'Content-Type': 'text/html' }, status);
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(status === 200 ? 502 : status);
    expect(fixture.delivered()).toBe(0);
    expect(fixture.cancel).toHaveBeenCalledOnce();
  });

  it('accepts exactly the existing size limit', async () => {
    const fixture = upstreamStream([new Uint8Array(limit)]);
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(200);
    expect((await response.arrayBuffer()).byteLength).toBe(limit);
    expect(fixture.response.body?.locked).toBe(false);
  });

  it('preserves multibyte JSON across buffer growth and small chunk boundaries', async () => {
    const data = { description: '\u00e9'.repeat(4096) };
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    const chunks: Uint8Array[] = [];
    for (let offset = 0; offset < bytes.length; offset += 127) {
      chunks.push(bytes.slice(offset, offset + 127));
    }
    upstreamStream(chunks);
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(data);
  });

  it('rejects methods other than GET without starting an upstream request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await proxyJobRadar(new Request(requestUrl, { method: 'POST' }), '/jobs');
    expect(response.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['application/json; charset=utf-8', 'application/problem+json'])(
    'preserves a JSON error with content-type %s', async (contentType) => {
      const bytes = new TextEncoder().encode('{"detail":"Synthetic error"}');
      upstreamStream([bytes.slice(0, 4), new Uint8Array(0), bytes.slice(4)],
        { 'Content-Type': contentType }, 422);
      const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ detail: 'Synthetic error' });
      expect(response.headers.get('Content-Type')).toBe(contentType);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.has('Authorization')).toBe(false);
    });

  it('rejects an interrupted response without exposing its error text', async () => {
    let reads = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        reads += 1;
        if (reads === 1) controller.enqueue(new Uint8Array(2));
        else controller.error(new Error('synthetic-private-upstream-message'));
      },
    }, { highWaterMark: 0 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body,
      { headers: { 'Content-Type': 'application/json' } })));
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ detail: 'The upstream API is unavailable.' });
    expect(body.locked).toBe(false);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls))
      .not.toContain('synthetic-private-upstream-message');
  });

  it.each(['timeout', 'client'])('cancels a stalled body after %s abort', async (kind) => {
    const deadline = new AbortController();
    const client = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
    const cancel = vi.fn();
    let reading!: () => void;
    const started = new Promise<void>((resolve) => { reading = resolve; });
    const body = new ReadableStream<Uint8Array>({ pull() { reading(); }, cancel },
      { highWaterMark: 0 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body,
      { headers: { 'Content-Type': 'application/json' } })));
    const result = proxyJobRadar(new Request(requestUrl, { signal: client.signal }), '/jobs');
    await started;
    if (kind === 'timeout') deadline.abort(new DOMException('Synthetic timeout', 'TimeoutError'));
    else client.abort();
    const response = await result;
    expect(response.status).toBe(kind === 'timeout' ? 504 : 502);
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(10_000);
  }, 1000);

  it('does not wait for a stalled cancellation callback', async () => {
    const cancel = vi.fn(() => new Promise<void>(() => undefined));
    const body = new ReadableStream<Uint8Array>({ cancel }, { highWaterMark: 0 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body,
      { headers: { 'Content-Type': 'text/html' } })));
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(502);
    expect(cancel).toHaveBeenCalledOnce();
  }, 1000);

  it('does not fetch for an already cancelled client request', async () => {
    const client = new AbortController();
    client.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await proxyJobRadar(new Request(requestUrl, { signal: client.signal }), '/jobs');
    expect(response.status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([204, 205, 304])('preserves an empty response at status %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {
      status, headers: { 'Content-Type': 'application/json' },
    })));
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(status);
    expect(await response.text()).toBe('');
  });

  it('keeps a rejected cancellation from hiding the original response error', async () => {
    const body = new ReadableStream<Uint8Array>({
      cancel() { return Promise.reject(new Error('synthetic-cancellation-failure')); },
    }, { highWaterMark: 0 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, {
      headers: { 'Content-Type': 'text/html' },
    })));
    const response = await proxyJobRadar(new Request(requestUrl), '/jobs');
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ detail: 'The upstream API returned an invalid response.' });
  });
});
