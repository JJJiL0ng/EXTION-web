
import { create } from 'zustand';

interface TargetSheetNameStore {
    targetSheetName: string;
    setTargetSheetName: (name: string) => void;
}

export const useTargetSheetNameStore = create<TargetSheetNameStore>((set) => ({
    targetSheetName: '',
    setTargetSheetName: (targetSheetName) => set({ targetSheetName }),
}));
