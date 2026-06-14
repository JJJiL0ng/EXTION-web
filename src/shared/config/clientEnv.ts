const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export function getClientApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  return apiBaseUrl.replace(/\/+$/, '');
}
