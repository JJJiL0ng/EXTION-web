import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SPREADSHEET_VERSION_STORAGE_KEY = 'spreadsheet-version-storage';

export interface SpreadSheetVersionState {
  spreadSheetVersionId: string | null;
  editLockVersion: number | null;
  setSpreadSheetVersion: (version: string) => void;
  setEditLockVersion: (version: number) => void;
  resetSpreadSheetVersion: () => void;
  resetEditLockVersion: () => void;
}

export const useSpreadSheetVersionStore = create<SpreadSheetVersionState>()(
  persist(
    (set) => ({
      spreadSheetVersionId: null,
      setSpreadSheetVersion: (newVersion) =>
        set({
          spreadSheetVersionId: newVersion,
        }),

      editLockVersion: null,
      setEditLockVersion: (newVersion) =>
        set({
          editLockVersion: newVersion,
        }),

      resetSpreadSheetVersion: () => {
        set({ spreadSheetVersionId: null });
      },
      resetEditLockVersion: () => {
        set({ editLockVersion: null });
      },
    }),
    {
      name: SPREADSHEET_VERSION_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        spreadSheetVersionId: state.spreadSheetVersionId,
        editLockVersion: state.editLockVersion,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
