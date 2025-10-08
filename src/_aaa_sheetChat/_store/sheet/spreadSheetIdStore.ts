import { create } from 'zustand';

interface SSpreadsheetState {
  spreadSheetId: string | null;
  setSpreadSheetId: (newSpreadSheetId: string) => void;
  resetSpreadSheetId: () => void;
}

const useSpreadSheetIdStore = create<SSpreadsheetState>((set) => ({
  spreadSheetId: null,
  setSpreadSheetId: (newSpreadSheetId) => set({ spreadSheetId: newSpreadSheetId }),
  resetSpreadSheetId: () => set({ spreadSheetId: null }),
}));

export default useSpreadSheetIdStore;