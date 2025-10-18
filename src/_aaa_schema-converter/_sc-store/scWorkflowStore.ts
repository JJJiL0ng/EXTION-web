import { create } from 'zustand';

interface ScWorkflowStore {
  workflowCodeId: string;
  sourceSheetVersionId: string;
  targetSheetVersionId: string;
  setWorkflowCodeId: (id: string) => void;
  setSourceSheetVersionId: (id: string) => void;
  setTargetSheetVersionId: (id: string) => void;
}

export const useScWorkflowStore = create<ScWorkflowStore>((set) => ({
  workflowCodeId: '',
  sourceSheetVersionId: '',
  targetSheetVersionId: '',
  setWorkflowCodeId: (workflowCodeId) => set({ workflowCodeId }),
  setSourceSheetVersionId: (sourceSheetVersionId) => set({ sourceSheetVersionId }),
  setTargetSheetVersionId: (targetSheetVersionId) => set({ targetSheetVersionId }),
}));
