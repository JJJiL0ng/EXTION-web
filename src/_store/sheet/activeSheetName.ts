import { create } from 'zustand';

interface ActiveSheetState {
  activeSheetName: string;
  activeSheetIndex: number;
  setActiveSheetName: (name: string) => void;
  setActiveSheetIndex: (index: number) => void;
  setActiveSheet: (name: string, index: number) => void;
  resetActiveSheet: () => void;
}

const useActiveSheetStore = create<ActiveSheetState>((set) => ({
  activeSheetName: '',
  activeSheetIndex: 0,
  
  setActiveSheetName: (name: string) => 
    set({ activeSheetName: name }),
  
  setActiveSheetIndex: (index: number) => 
    set({ activeSheetIndex: index }),
  
  setActiveSheet: (name: string, index: number) => 
    set({ activeSheetName: name, activeSheetIndex: index }),
  
  resetActiveSheet: () => 
    set({ activeSheetName: '', activeSheetIndex: 0 }),
}));

export default useActiveSheetStore;