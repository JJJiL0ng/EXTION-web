import { describe, expect, it } from 'vitest';
import {
  QUERY_KEYS,
  checkAndLoadQueryKeys,
  getCheckAndLoadParamsFromQueryKey,
} from './queryKeys';

const params = {
  spreadSheetId: 'sheet-1',
  chatId: 'chat-1',
  userId: 'user-1',
  spreadSheetVersionId: 'version-1',
};

describe('queryKeys', () => {
  it('creates stable check-and-load keys', () => {
    expect(QUERY_KEYS.checkAndLoad(params)).toEqual([
      'checkAndLoad',
      params,
    ]);
    expect(checkAndLoadQueryKeys.all).toEqual(['checkAndLoad']);
  });

  it('normalizes missing version ids to null', () => {
    expect(QUERY_KEYS.checkAndLoad({ ...params, spreadSheetVersionId: undefined })).toEqual([
      'checkAndLoad',
      { ...params, spreadSheetVersionId: null },
    ]);
  });

  it('extracts params from valid query keys', () => {
    expect(getCheckAndLoadParamsFromQueryKey(QUERY_KEYS.checkAndLoad(params))).toEqual(params);
  });

  it('rejects unrelated query keys', () => {
    expect(getCheckAndLoadParamsFromQueryKey(['chatHistory', 'chat-1'])).toBeNull();
    expect(getCheckAndLoadParamsFromQueryKey(['checkAndLoad', { spreadSheetId: 'sheet-1' }])).toBeNull();
  });
});
