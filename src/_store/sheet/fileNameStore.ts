import { create } from 'zustand';

interface fileNameState {
  fileName: string | null;
  setFileName: (newSpreadsheetId: string) => void;
  resetFileName: () => void;
}

const useFileNameStore = create<fileNameState>((set) => ({
  fileName: null,
  setFileName: (newSpreadsheetId) => set({ fileName: newSpreadsheetId }),
  resetFileName: () => set({ fileName: null }),
}));

export default useFileNameStore;