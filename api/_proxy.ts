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

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${configuration.token}`,
      },
      redirect: 'error',
      signal: AbortSignal.timeout(upstreamTimeoutMilliseconds),
    });
    const declaredLength = Number(upstreamResponse.headers.get('content-length'));

    if (Number.isFinite(declaredLength) && declaredLength > maximumResponseBytes) {
      return jsonError(502, 'The upstream API response is too large.');
    }

    const body = await upstreamResponse.arrayBuffer();
    if (body.byteLength > maximumResponseBytes) {
      return jsonError(502, 'The upstream API response is too large.');
    }

    const contentType = upstreamResponse.headers.get('content-type');
    if (!isJsonContentType(contentType)) {
      return jsonError(
        upstreamResponse.ok ? 502 : upstreamResponse.status,
        'The upstream API returned an invalid response.',
      );
    }

    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': contentType ?? 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    console.error(
      'JobRadar API proxy request failed.',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return jsonError(
      timedOut ? 504 : 502,
      timedOut ? 'The upstream API timed out.' : 'The upstream API is unavailable.',
    );
  }
}
