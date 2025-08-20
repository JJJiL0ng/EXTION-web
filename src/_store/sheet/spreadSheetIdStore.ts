import { create } from 'zustand';

interface SSpreadsheetState {
  spreadsheetId: string | null;
  setSpreadsheetId: (newSpreadsheetId: string) => void;
  resetSpreadsheetId: () => void;
}

const useSpreadsheetIdStore = create<SSpreadsheetState>((set) => ({
  spreadsheetId: null,
  setSpreadsheetId: (newSpreadsheetId) => set({ spreadsheetId: newSpreadsheetId }),
  resetSpreadsheetId: () => set({ spreadsheetId: null }),
}));

export default useSpreadsheetIdStore;