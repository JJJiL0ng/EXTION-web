import { beforeEach, describe, expect, it } from 'vitest';

import {
  SPREADSHEET_VERSION_STORAGE_KEY,
  useSpreadSheetVersionStore,
} from './spreadSheetVersionIdStore';

describe('useSpreadSheetVersionStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSpreadSheetVersionStore.setState({
      spreadSheetVersionId: null,
      editLockVersion: null,
    });
  });

  it('stores spreadsheet version fields with the documented storage key', () => {
    useSpreadSheetVersionStore.getState().setSpreadSheetVersion('version-1');
    useSpreadSheetVersionStore.getState().setEditLockVersion(3);

    const persisted = JSON.parse(localStorage.getItem(SPREADSHEET_VERSION_STORAGE_KEY) ?? '{}');

    expect(persisted).toEqual({
      state: {
        spreadSheetVersionId: 'version-1',
        editLockVersion: 3,
      },
      version: 1,
    });
  });

  it('resets spreadsheet version fields through the persist middleware', () => {
    useSpreadSheetVersionStore.getState().setSpreadSheetVersion('version-2');
    useSpreadSheetVersionStore.getState().setEditLockVersion(4);

    useSpreadSheetVersionStore.getState().resetSpreadSheetVersion();
    useSpreadSheetVersionStore.getState().resetEditLockVersion();

    expect(useSpreadSheetVersionStore.getState().spreadSheetVersionId).toBeNull();
    expect(useSpreadSheetVersionStore.getState().editLockVersion).toBeNull();

    const persisted = JSON.parse(localStorage.getItem(SPREADSHEET_VERSION_STORAGE_KEY) ?? '{}');

    expect(persisted.state).toEqual({
      spreadSheetVersionId: null,
      editLockVersion: null,
    });
  });
});
