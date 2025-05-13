import { create } from 'zustand';

interface FileState {
  csvData: string[][] | null;
  fileName: string | null;
  setCSVData: (data: string[][] | null, fileName: string | null) => void;
  clearCSVData: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  csvData: null,
  fileName: null,
  setCSVData: (data, fileName) => set({ csvData: data, fileName }),
  clearCSVData: () => set({ csvData: null, fileName: null }),
}));
