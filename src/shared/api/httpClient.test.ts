import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './apiError';
import { getJson, postJson } from './httpClient';

const originalEnv = process.env.NEXT_PUBLIC_API_URL;

describe('httpClient', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    vi.restoreAllMocks();
  });

  it('builds API urls with query params and parses JSON responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getJson('/v2/table-data-json-save/check-and-load', {
        query: { spreadSheetId: 'sheet-1', spreadSheetVersionId: null },
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v2/table-data-json-save/check-and-load?spreadSheetId=sheet-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends JSON request bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await postJson('/invite-code', { node: 'admin' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/invite-code',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: 'admin' }),
      }),
    );
  });

  it('throws typed API errors with parsed response bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'invalid code' }), {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(postJson('/auth/verify-invite', { inviteCode: 'bad' }, { errorMessage: 'verify failed' }))
      .rejects
      .toMatchObject<ApiError>({
        name: 'ApiError',
        message: 'verify failed: invalid code',
        status: 400,
        statusText: 'Bad Request',
      });
  });
});
