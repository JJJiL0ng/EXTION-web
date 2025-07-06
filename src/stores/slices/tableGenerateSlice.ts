import { StateCreator } from 'zustand';
import {
  ProcessChatResponse,
  FileUploadProgress,
} from '@/services/api/tablegenerateService';

export interface TableGenerateState {
  loading: boolean;
  error: string | null;
  data: ProcessChatResponse | null;
  progress: FileUploadProgress;
  
  startGeneration: () => void;
  setGenerationSuccess: (data: ProcessChatResponse) => void;
  setGenerationError: (error: string) => void;
  setProgress: (progress: FileUploadProgress) => void;
  resetTableGenerateState: () => void;
}

const initialState = {
  loading: false,
  error: null,
  data: null,
  progress: { loaded: 0, total: 0, percentage: 0 },
};

export const createTableGenerateSlice: StateCreator<
  TableGenerateState,
  [],
  [],
  TableGenerateState
> = (set, get) => ({
  ...initialState,
  startGeneration: () => set({ loading: true, error: null, data: null, progress: { loaded: 0, total: 0, percentage: 0 } }),
  setGenerationSuccess: (data) => set({ loading: false, data, error: null }),
  setGenerationError: (error) => set({ loading: false, error, data: null }),
  setProgress: (progress) => set({ progress }),
  resetTableGenerateState: () => set(initialState),
}); 