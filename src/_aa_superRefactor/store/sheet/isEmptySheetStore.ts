import { create } from 'zustand';

interface IsEmptySheetState {
  isEmptySheet: boolean;
  setIsEmptySheet: (isEmpty: boolean) => void;
}

export const useIsEmptySheetStore = create<IsEmptySheetState>((set) => ({
  isEmptySheet: false,
  setIsEmptySheet: (isEmpty: boolean) => set({ isEmptySheet: isEmpty }),
}));