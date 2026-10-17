const upstreamTimeoutMilliseconds = 10_000;
const maximumResponseBytes = 10_000_000;

interface ProxyConfiguration {
  origin: URL;
  token: string;
}

function loadProxyConfiguration(): ProxyConfiguration {
  const rawOrigin = process.env.JOBRADAR_API_ORIGIN?.trim();
  const token = process.env.JOBRADAR_API_TOKEN?.trim();

  if (!rawOrigin || !token) {
    throw new Error('Missing JobRadar API proxy configuration.');
  }

  const origin = new URL(rawOrigin);
  const isLocalDevelopment =
    origin.protocol === 'http:' &&
    (origin.hostname === 'localhost' || origin.hostname === '127.0.0.1');

  if (
    (origin.protocol !== 'https:' && !isLocalDevelopment) ||
    origin.username ||
    origin.password ||
    (origin.pathname !== '/' && origin.pathname !== '') ||
    origin.search ||
    origin.hash
  ) {
    throw new Error('Invalid JobRadar API proxy origin.');
  }
  if (token.length < 32) {
    throw new Error('Invalid JobRadar API proxy token.');
  }

  return { origin, token };
}

function jsonError(status: number, detail: string): Response {
  return Response.json(
    { detail },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}

function isJsonContentType(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const mediaType = value.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType === 'application/json' || Boolean(mediaType?.endsWith('+json'));
}

class UpstreamResponseTooLargeError extends Error {}

async function readBoundedBody(
  response: Response,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  signal.throwIfAborted();
  if (!response.body) {
    return new ArrayBuffer(0);
  }

  const reader = response.body.getReader();
  const cancelRead = () => {
    // Do not let a slow cancellation callback extend the request deadline.
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', cancelRead, { once: true });
  let buffer = new Uint8Array(0);
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) {
        return buffer.slice(0, size).buffer;
      }
      const nextSize = size + value.byteLength;
      if (nextSize > maximumResponseBytes) {
        throw new UpstreamResponseTooLargeError();
      }
      if (nextSize > buffer.byteLength) {
        const capacity = Math.min(
          maximumResponseBytes,
          Math.max(nextSize, buffer.byteLength * 2, 1024),
        );
        const expanded = new Uint8Array(capacity);
        expanded.set(buffer.subarray(0, size));
        buffer = expanded;
      }
      buffer.set(value, size);
      size = nextSize;
    }
  } finally {
    signal.removeEventListener('abort', cancelRead);
    reader.releaseLock();
  }
}

export async function proxyJobRadar(
  request: Request,
  upstreamPath: string,
): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonError(405, 'Method not allowed.');
  }

  let configuration: ProxyConfiguration;

  try {
    configuration = loadProxyConfiguration();
  } catch (error) {
    console.error(
      'JobRadar API proxy configuration is invalid.',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return jsonError(503, 'The API proxy is not configured.');
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(upstreamPath, configuration.origin);
  upstreamUrl.search = incomingUrl.search;

  const controller = new AbortController();
  const signal = AbortSignal.any([
    AbortSignal.timeout(upstreamTimeoutMilliseconds),
    controller.signal,
    request.signal,
  ]);
  let upstreamResponse: Response | undefined;

  try {
    signal.throwIfAborted();
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${configuration.token}`,
      },
      redirect: 'error',
      signal,
    });
    const declaredLength = Number(upstreamResponse.headers.get('content-length'));

    if (Number.isFinite(declaredLength) && declaredLength > maximumResponseBytes) {
      return jsonError(502, 'The upstream API response is too large.');
    }

    const contentType = upstreamResponse.headers.get('content-type');
    if (!isJsonContentType(contentType)) {
      return jsonError(
        upstreamResponse.ok ? 502 : upstreamResponse.status,
        'The upstream API returned an invalid response.',
      );
    }

    const body = await readBoundedBody(upstreamResponse, signal);
    return new Response([204, 205, 304].includes(upstreamResponse.status) ? null : body, {
      status: upstreamResponse.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': contentType ?? 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof UpstreamResponseTooLargeError) {
      return jsonError(502, 'The upstream API response is too large.');
    }
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    console.error(
      'JobRadar API proxy request failed.',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return jsonError(
      timedOut ? 504 : 502,
      timedOut ? 'The upstream API timed out.' : 'The upstream API is unavailable.',
    );
  } finally {
    controller.abort();
    // The primary result must not be hidden by cancellation failures.
    void upstreamResponse?.body?.cancel().catch(() => undefined);
  }
}
