import { createServer, type RequestListener, type Server } from 'node:http';
import { gzipSync } from 'node:zlib';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyJobRadar } from './_proxy';

describe.sequential('JobRadar proxy with real loopback HTTP', () => {
  let server: Server | undefined;

  async function listen(handler: RequestListener) {
    server = createServer(handler);
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing loopback address');
    vi.stubEnv('JOBRADAR_API_ORIGIN', `http://127.0.0.1:${address.port}`);
  }

  beforeEach(() => {
    vi.stubEnv('JOBRADAR_API_TOKEN', 'a'.repeat(32));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('limits decompressed bytes from an actual gzip response', async () => {
    const compressed = gzipSync(Buffer.alloc(10_000_001, 32));
    expect(compressed.byteLength).toBeLessThan(100_000);
    await listen((_request, response) => {
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Content-Length': compressed.byteLength,
      });
      response.end(compressed);
    });
    const response = await proxyJobRadar(new Request('https://app.example.com/api/jobs'), '/jobs');
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ detail: 'The upstream API response is too large.' });
  });

  it('closes a chunked connection before the remaining oversized body is produced', async () => {
    let sent = 0;
    let closeConnection!: () => void;
    const closed = new Promise<void>((resolve) => { closeConnection = resolve; });
    await listen((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      const chunk = Buffer.alloc(65_536, 32);
      const timer = setInterval(() => {
        sent += 1;
        response.write(chunk);
        if (sent === 320) {
          clearInterval(timer);
          response.end();
        }
      }, 1);
      response.on('close', () => { clearInterval(timer); closeConnection(); });
    });
    const response = await proxyJobRadar(new Request('https://app.example.com/api/jobs'), '/jobs');
    expect(response.status).toBe(502);
    await closed;
    expect(sent).toBeLessThan(320);
  });

  it.each(['headers', 'body'])('applies the deadline while waiting for %s', async (stage) => {
    const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => nativeTimeout(100));
    await listen((_request, response) => {
      if (stage === 'body') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write('{"items":[');
      }
    });
    const response = await proxyJobRadar(new Request('https://app.example.com/api/jobs'), '/jobs');
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ detail: 'The upstream API timed out.' });
  });
});
