import { create } from 'zustand';

interface SpreadSheetVersionState {
  spreadSheetVersionId: string | null;
  editLockVersion: number | null;
  setVersion: (version: string) => void;
  setEditLockVersion: (version: number) => void;
}

export const useSpreadSheetVersionStore = create<SpreadSheetVersionState>((set) => ({
  // 기본값을 null로 설정합니다.
  spreadSheetVersionId: null,
    /**
   * @param newVersion - 설정할 새로운 버전 id
   */
  setVersion: (newVersion) =>
    set({
      spreadSheetVersionId: newVersion,
    }),

  editLockVersion: null,
  /**
   * @param newVersion - 설정할 새로운 낙관적 잠금 버전 번호
   */
  setEditLockVersion: (newVersion) =>
    set({
      editLockVersion: newVersion,
    }),
}));
