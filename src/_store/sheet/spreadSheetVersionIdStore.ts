import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // persist와 createJSONStorage를 임포트합니다.

interface SpreadSheetVersionState {
  spreadSheetVersionId: string | null;
  editLockVersion: number | null;
  setSpreadSheetVersion: (version: string) => void;
  setEditLockVersion: (version: number) => void;
  resetSpreadSheetVersion: () => void;
  resetEditLockVersion: () => void;
}

export const useSpreadSheetVersionStore = create<SpreadSheetVersionState>()( // create<SpreadSheetVersionState>()() 형태로 변경
  persist( // persist 미들웨어를 적용합니다.
    (set) => ({
      // 기본값을 null로 설정합니다.
      spreadSheetVersionId: null,
      /**
       * @param newVersion - 설정할 새로운 버전 id
       */
      setSpreadSheetVersion: (newVersion) =>
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

      resetSpreadSheetVersion: () => {
        console.log('resetSpreadSheetVersion 호출됨');
        set({ spreadSheetVersionId: null });
        // 명시적으로 로컬 스토리지도 업데이트
        const currentStorage = localStorage.getItem('spreadsheet-version-storage');
        if (currentStorage) {
          const parsed = JSON.parse(currentStorage);
          parsed.state.spreadSheetVersionId = null;
          localStorage.setItem('spreadsheet-version-storage', JSON.stringify(parsed));
        }
      },
      resetEditLockVersion: () => {
        console.log('resetEditLockVersion 호출됨');
        set({ editLockVersion: null });
        // 명시적으로 로컬 스토리지도 업데이트
        const currentStorage = localStorage.getItem('spreadsheet-version-storage');
        if (currentStorage) {
          const parsed = JSON.parse(currentStorage);
          parsed.state.editLockVersion = null;
          localStorage.setItem('spreadsheet-version-storage', JSON.stringify(parsed));
        }
      },
    }),
    {
      name: 'spreadsheet-version-storage', // localStorage에 저장될 때 사용될 키 이름
      storage: createJSONStorage(() => localStorage), // localStorage를 저장소로 사용
      // (선택 사항) 특정 상태만 저장하고 싶다면 partialize를 사용할 수 있습니다.
      // partialize: (state) => ({ spreadSheetVersionId: state.spreadSheetVersionId }),
    }
  )
);