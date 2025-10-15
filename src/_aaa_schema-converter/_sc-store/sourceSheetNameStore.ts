
import { create } from 'zustand';

interface SourceSheetNameStore {
    sourceSheetName: string;
    setSourceSheetName: (name: string) => void;
}

export const useSourceSheetNameStore = create<SourceSheetNameStore>((set) => ({
    sourceSheetName: '',
    setSourceSheetName: (sourceSheetName) => {
        set({ sourceSheetName });
    },
}));
