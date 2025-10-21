import { create } from 'zustand';

interface TargetSheetRangeStore {
    targetRange: [number, number, number, number];
    setTargetRange: (range: [number, number, number, number]) => void;
}

export const useTargetSheetRangeStore = create<TargetSheetRangeStore>((set) => ({
    targetRange: [0, 0, 1, 1], // 기본값: 1행 × 1열
    setTargetRange: (targetRange) => set({ targetRange }),
}));
