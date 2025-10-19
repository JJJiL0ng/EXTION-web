import { create } from 'zustand';

interface ScWorkflowStore {
  workflowCodeId: string;
  sourceSheetVersionId: string;
  targetSheetVersionId: string;
  workFlowId: string;
  setWorkflowCodeId: (id: string) => void;
  setSourceSheetVersionId: (id: string) => void;
  setTargetSheetVersionId: (id: string) => void;
  setWorkFlowId: (id: string) => void;
}

export const useScWorkflowStore = create<ScWorkflowStore>((set) => ({
  workflowCodeId: '',
  sourceSheetVersionId: '',
  targetSheetVersionId: '',
  workFlowId: '',
  setWorkflowCodeId: (workflowCodeId) => set({ workflowCodeId }),
  setSourceSheetVersionId: (sourceSheetVersionId) => set({ sourceSheetVersionId }),
  setTargetSheetVersionId: (targetSheetVersionId) => set({ targetSheetVersionId }),
  setWorkFlowId: (workFlowId) => set({ workFlowId }),
}));
