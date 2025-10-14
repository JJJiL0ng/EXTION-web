import { create } from 'zustand';

interface SourceSheetRangeStore {
    sourceRange: [number, number, number, number];
    setSourceRange: (range: [number, number, number, number]) => void;
}

export const useSourceSheetRangeStore = create<SourceSheetRangeStore>((set) => ({
    sourceRange: [0, 0, 0, 0],
    setSourceRange: (sourceRange) => set({ sourceRange }),
}));
