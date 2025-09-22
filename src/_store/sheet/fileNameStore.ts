import { create } from 'zustand';

interface fileNameState {
  fileName: string | null;
  lastUpdated: number | null; // 마지막 수정 시간 추가
  setFileName: (newSpreadsheetId: string) => void;
  setFileNameFromServer: (newSpreadsheetId: string) => void; // 서버에서 오는 업데이트용
  resetFileName: () => void;
}

const useFileNameStore = create<fileNameState>((set, get) => ({
  fileName: null,
  lastUpdated: null,
  setFileName: (newSpreadsheetId) => set({
    fileName: newSpreadsheetId,
    lastUpdated: Date.now()
  }),
  setFileNameFromServer: (newSpreadsheetId) => {
    const state = get();
    // 5초 이내에 사용자가 직접 변경한 경우 서버 응답을 무시
    const now = Date.now();
    if (state.lastUpdated && (now - state.lastUpdated) < 5000) {
      console.log('🚫 [fileNameStore] 최근 사용자 변경으로 인해 서버 응답 무시:', {
        serverName: newSpreadsheetId,
        currentName: state.fileName,
        timeSinceUpdate: now - state.lastUpdated
      });
      return;
    }

    set({ fileName: newSpreadsheetId });
  },
  resetFileName: () => set({ fileName: null, lastUpdated: null }),
}));

export default useFileNameStore;