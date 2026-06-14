import type { QueryKey } from '@tanstack/react-query';
import type { CheckAndLoadReq } from '@/_aaa_sheetChat/_types/apiConnector/check-and-load-api/chectAndLoadApi';

export type CheckAndLoadQueryKey = readonly ['checkAndLoad', CheckAndLoadReq];

const checkAndLoadRoot = ['checkAndLoad'] as const;

function normalizeCheckAndLoadParams(params: CheckAndLoadReq): CheckAndLoadReq {
  return {
    spreadSheetId: params.spreadSheetId,
    chatId: params.chatId,
    userId: params.userId,
    spreadSheetVersionId: params.spreadSheetVersionId ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const checkAndLoadQueryKeys = {
  all: checkAndLoadRoot,
  detail: (params: CheckAndLoadReq): CheckAndLoadQueryKey => [
    ...checkAndLoadRoot,
    normalizeCheckAndLoadParams(params),
  ],
};

export const QUERY_KEYS = {
  checkAndLoad: checkAndLoadQueryKeys.detail,
  checkAndLoadAll: checkAndLoadQueryKeys.all,
  spreadSheet: (spreadSheetId: string) => ['spreadSheet', spreadSheetId] as const,
  chatHistory: (chatId: string) => ['chatHistory', chatId] as const,
};

export function getCheckAndLoadParamsFromQueryKey(queryKey: QueryKey): CheckAndLoadReq | null {
  if (queryKey[0] !== checkAndLoadRoot[0] || !isRecord(queryKey[1])) {
    return null;
  }

  const params = queryKey[1];

  if (
    typeof params.spreadSheetId !== 'string' ||
    typeof params.chatId !== 'string' ||
    typeof params.userId !== 'string'
  ) {
    return null;
  }

  const versionId = params.spreadSheetVersionId;

  return {
    spreadSheetId: params.spreadSheetId,
    chatId: params.chatId,
    userId: params.userId,
    spreadSheetVersionId: typeof versionId === 'string' ? versionId : null,
  };
}
