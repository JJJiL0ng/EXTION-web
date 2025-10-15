import { readFileSync } from 'fs';
import { PHASE_DEVELOPMENT_SERVER } from 'next/dist/shared/lib/constants';
import { create } from 'zustand';

interface SourceSheetRangeStore {
    sourceRange: [number, number, number, number];
    setSourceRange: (range: [number, number, number, number]) => void;
}

export const useSourceSheetRangeStore = create<SourceSheetRangeStore>((set) => ({
    sourceRange: [0, 0, 1, 1], // 기본값: 1행 × 1열
    setSourceRange: (sourceRange) => set({ sourceRange }),
}));
