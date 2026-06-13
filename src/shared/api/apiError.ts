export interface ApiErrorOptions {
  status: number;
  statusText: string;
  url: string;
  responseBody: unknown;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  responseBody: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = options.url;
    this.responseBody = options.responseBody;
  }
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) {
    return undefined;
  }

  if (typeof error.responseBody === 'object' && error.responseBody !== null && 'message' in error.responseBody) {
    const message = (error.responseBody as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  if (typeof error.responseBody === 'string' && error.responseBody.length > 0) {
    return error.responseBody;
  }

  return undefined;
}
