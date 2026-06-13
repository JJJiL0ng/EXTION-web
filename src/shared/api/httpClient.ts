import { getClientApiBaseUrl } from '@/shared/config/clientEnv';
import { ApiError, getApiErrorMessage } from './apiError';

type QueryValue = string | number | boolean | null | undefined;
type FetchInit = NonNullable<Parameters<typeof window.fetch>[1]>;

interface JsonRequestOptions extends Omit<FetchInit, 'body'> {
  query?: Record<string, QueryValue>;
  json?: unknown;
  errorMessage?: string;
  timeoutMs?: number;
}

function buildApiUrl(path: string, query?: Record<string, QueryValue>): string {
  const baseUrl = getClientApiBaseUrl();
  const url = new URL(path, path.startsWith('http') ? undefined : `${baseUrl}/`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => '');
}

function createAbortSignal(timeoutMs?: number): { signal?: AbortSignal; clear: () => void } {
  if (!timeoutMs) {
    return { clear: () => undefined };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
}

export async function jsonRequest<TResponse>(
  path: string,
  { query, json, errorMessage = 'API request failed', headers, timeoutMs, ...init }: JsonRequestOptions = {},
): Promise<TResponse> {
  const url = buildApiUrl(path, query);
  const abortSignal = createAbortSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: init.signal ?? abortSignal.signal,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });

    if (!response.ok) {
      const responseBody = await readResponseBody(response);
      const apiError = new ApiError(errorMessage, {
        status: response.status,
        statusText: response.statusText,
        url,
        responseBody,
      });
      const detailMessage = getApiErrorMessage(apiError);

      if (detailMessage) {
        apiError.message = `${errorMessage}: ${detailMessage}`;
      }

      throw apiError;
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  } finally {
    abortSignal.clear();
  }
}

export function getJson<TResponse>(
  path: string,
  options: Omit<JsonRequestOptions, 'method' | 'json'> = {},
): Promise<TResponse> {
  return jsonRequest<TResponse>(path, {
    ...options,
    method: 'GET',
  });
}

export function postJson<TResponse, TRequest>(
  path: string,
  json: TRequest,
  options: Omit<JsonRequestOptions, 'method' | 'json'> = {},
): Promise<TResponse> {
  return jsonRequest<TResponse>(path, {
    ...options,
    method: 'POST',
    json,
  });
}
