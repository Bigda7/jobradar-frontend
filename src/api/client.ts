import type { ZodType } from 'zod';

import { fastApiValidationErrorSchema } from './schemas';
import type { FastApiValidationError } from './types';

type QueryValue = string | number | boolean | null | undefined;

export type ApiErrorKind = 'http' | 'network' | 'invalid-response';

interface ApiErrorOptions {
  kind: ApiErrorKind;
  status?: number;
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
    this.details = options.details;
  }

  get validationError(): FastApiValidationError | null {
    if (this.status !== 422) {
      return null;
    }

    const result = fastApiValidationErrorSchema.safeParse(this.details);
    return result.success ? result.data : null;
  }
}

interface ApiRequestOptions<T, TQuery extends object> {
  schema: ZodType<T>;
  query?: TQuery;
  signal?: AbortSignal;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

function buildRequestUrl(
  path: string,
  query?: object,
): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const endpoint = path.replace(/^\/+/, '');
  const url = `${base}/${endpoint}`;

  if (!query) {
    return url;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query) as [string, QueryValue][]) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const search = searchParams.toString();
  return search ? `${url}?${search}` : url;
}

interface ResponseBody {
  data: unknown;
  malformedJson: boolean;
}

async function readResponseBody(response: Response): Promise<ResponseBody> {
  const body = await response.text();

  if (!body) {
    return { data: undefined, malformedJson: false };
  }

  try {
    return { data: JSON.parse(body) as unknown, malformedJson: false };
  } catch {
    return { data: body, malformedJson: true };
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export async function apiRequest<T, TQuery extends object = Record<string, never>>(
  path: string,
  options: ApiRequestOptions<T, TQuery>,
): Promise<T> {
  const url = buildRequestUrl(path, options.query);
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError('Unable to reach the API.', {
      kind: 'network',
      cause: error,
    });
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(`API request failed with status ${response.status}.`, {
      kind: 'http',
      status: response.status,
      details: body.data,
    });
  }

  if (body.malformedJson) {
    throw new ApiError('The API returned malformed JSON.', {
      kind: 'invalid-response',
      status: response.status,
    });
  }

  const parsed = options.schema.safeParse(body.data);

  if (!parsed.success) {
    throw new ApiError('The API response does not match the expected contract.', {
      kind: 'invalid-response',
      status: response.status,
      details: parsed.error.issues,
    });
  }

  return parsed.data;
}

interface ApiErrorMessageOptions {
  resource: string;
  validationMessage?: string;
}

export function getApiErrorMessage(
  error: unknown,
  options: ApiErrorMessageOptions,
): string {
  if (!(error instanceof ApiError)) {
    return `${options.resource} could not be loaded. Try again in a moment.`;
  }

  if (error.kind === 'network') {
    return 'The API could not be reached. Check your connection, API availability, and CORS configuration.';
  }

  if (error.kind === 'invalid-response') {
    return 'The API response does not match the expected contract.';
  }

  if (error.status === 422) {
    return options.validationMessage ?? 'The request was rejected by the API.';
  }

  if (error.status === 429) {
    return 'The API rate limit was reached. Wait briefly before trying again.';
  }

  if (error.status === 500 || error.status === 503) {
    return `The API is temporarily unavailable (${error.status}). Try again in a moment.`;
  }

  if (error.status !== undefined && error.status >= 500) {
    return `The API returned a server error (${error.status}). Try again in a moment.`;
  }

  return `${options.resource} could not be loaded. Try again in a moment.`;
}
