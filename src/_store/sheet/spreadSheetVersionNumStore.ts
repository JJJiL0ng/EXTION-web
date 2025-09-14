import { create } from 'zustand';

interface SpreadSheetVersionState {
  spreadSheetVersionNum: number;
  setVersion: (version: number) => void;
}

export const useSpreadSheetVersionStore = create<SpreadSheetVersionState>((set) => ({
  // 기본값을 1로 설정합니다.
  spreadSheetVersionNum: 1,

  /**
   * 버전을 특정 숫자로 설정합니다.
   * 입력된 값이 1보다 작으면 1로 저장합니다.
   * @param newVersion - 설정할 새로운 버전 번호
   */
  setVersion: (newVersion) =>
    set({
      spreadSheetVersionNum: Math.max(1, newVersion), // 최솟값을 1로 보장
    }),
}));
