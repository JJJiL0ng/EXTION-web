// stores/useUnifiedDataStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CSVData {
  headers: string[];
  data: string[][];
  fileName: string;
}

interface SheetContext {
  sheetName: string;
  headers: HeaderInfo[];
  dataRange: DataRange;
  sampleData?: Record<string, string>[];
}

interface HeaderInfo {
  column: string;
  name: string;
}

interface DataRange {
  startRow: string;
  endRow: string;
  startColumn?: string;
  endColumn?: string;
}

interface FormulaApplication {
  formula: string;
  cellAddress: string;
  explanation: string;
  timestamp: Date;
}

interface ArtifactCode {
  code: string;
  type: 'chart' | 'table' | 'analysis';
  timestamp: Date;
}

interface UnifiedDataStoreState {
  // === Raw CSV Data ===
  rawCsvData: CSVData | null;
  
  // === Computed Data (포뮬러 결과 포함) ===
  computedData: string[][] | null;
  
  // === Sheet Context (derived from rawCsvData) ===
  sheetContext: SheetContext | null;
  
  // === Loading States ===
  loadingStates: {
    fileUpload: boolean;
    formulaGeneration: boolean;
    artifactGeneration: boolean;
  };
  
  // === Error States ===
  errors: {
    fileError: string | null;
    formulaError: string | null;
    artifactError: string | null;
  };
  
  // === Formula Management ===
  pendingFormula: FormulaApplication | null;
  formulaHistory: FormulaApplication[];
  
  // === Artifact Management ===
  artifactCode: ArtifactCode | null;
  
  // === Internal Flags ===
  isInternalUpdate: boolean;
}

interface UnifiedDataStoreActions {
  // === Actions ===
  // CSV Data Actions
  setRawCsvData: (data: CSVData | null) => void;
  updateCellData: (row: number, col: number, value: string) => void;
  setComputedData: (data: string[][] | null) => void;
  
  // Loading Actions
  setLoadingState: (type: keyof UnifiedDataStoreState['loadingStates'], loading: boolean) => void;
  
  // Error Actions
  setError: (type: keyof UnifiedDataStoreState['errors'], error: string | null) => void;
  
  // Formula Actions
  setPendingFormula: (formula: FormulaApplication | null) => void;
  addToFormulaHistory: (formula: FormulaApplication) => void;
  clearFormulaHistory: () => void;
  
  // Artifact Actions
  setArtifactCode: (code: ArtifactCode | null) => void;
  
  // Internal Actions
  setInternalUpdate: (flag: boolean) => void;
  
  // Computed Actions
  updateSheetContext: () => void;
  getCurrentData: () => string[][] | null;
}

type UnifiedDataStore = UnifiedDataStoreState & UnifiedDataStoreActions;

// Helper function: CSV 데이터를 SheetContext로 변환
const generateSheetContext = (csvData: CSVData): SheetContext => {
  const headers: HeaderInfo[] = csvData.headers.map((header, index) => ({
    column: String.fromCharCode(65 + index),
    name: header
  }));

  const dataRange: DataRange = {
    startRow: '2',
    endRow: (csvData.data.length + 1).toString(),
    startColumn: 'A',
    endColumn: String.fromCharCode(64 + csvData.headers.length)
  };

  const sampleData = csvData.data.slice(0, 3).map(row => {
    const rowData: Record<string, string> = {};
    csvData.headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });
    return rowData;
  });

  return {
    sheetName: csvData.fileName || 'Sheet1',
    headers,
    dataRange,
    sampleData
  };
};

export const useUnifiedDataStore = create<UnifiedDataStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      rawCsvData: null,
      computedData: null,
      sheetContext: null,
      loadingStates: {
        fileUpload: false,
        formulaGeneration: false,
        artifactGeneration: false,
      },
      errors: {
        fileError: null,
        formulaError: null,
        artifactError: null,
      },
      pendingFormula: null,
      formulaHistory: [],
      artifactCode: null,
      isInternalUpdate: false,
      
      // CSV Data Actions
      setRawCsvData: (data) => {
        set((state) => {
          const newState = { 
            ...state, 
            rawCsvData: data,
            computedData: data ? [...data.data] : null
          };
          
          // SheetContext 자동 업데이트
          if (data) {
            newState.sheetContext = generateSheetContext(data);
          } else {
            newState.sheetContext = null;
          }
          
          return newState;
        });
      },
      
      updateCellData: (row, col, value) => {
        set((state) => {
          if (!state.rawCsvData || !state.computedData) return state;
          
          // Raw 데이터 업데이트
          const newRawData = { ...state.rawCsvData };
          if (newRawData.data[row]) {
            newRawData.data[row] = [...newRawData.data[row]];
            newRawData.data[row][col] = value;
          }
          
          // Computed 데이터 업데이트
          const newComputedData = [...state.computedData];
          if (newComputedData[row]) {
            newComputedData[row] = [...newComputedData[row]];
            newComputedData[row][col] = value;
          }
          
          return {
            ...state,
            rawCsvData: newRawData,
            computedData: newComputedData,
            sheetContext: generateSheetContext(newRawData)
          };
        });
      },
      
      setComputedData: (data) => set({ computedData: data }),
      
      // Loading Actions
      setLoadingState: (type, loading) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, [type]: loading }
        })),
      
      // Error Actions
      setError: (type, error) =>
        set((state) => ({
          errors: { ...state.errors, [type]: error }
        })),
      
      // Formula Actions
      setPendingFormula: (formula) => set({ pendingFormula: formula }),
      
      addToFormulaHistory: (formula) =>
        set((state) => ({
          formulaHistory: [...state.formulaHistory, formula]
        })),
      
      clearFormulaHistory: () => set({ formulaHistory: [] }),
      
      // Artifact Actions
      setArtifactCode: (code) => set({ artifactCode: code }),
      
      // Internal Actions
      setInternalUpdate: (flag) => set({ isInternalUpdate: flag }),
      
      // Computed Actions
      updateSheetContext: () => {
        const { rawCsvData } = get();
        if (rawCsvData) {
          set({ sheetContext: generateSheetContext(rawCsvData) });
        }
      },
      
      getCurrentData: () => {
        const { computedData, rawCsvData } = get();
        if (computedData) return computedData;
        if (rawCsvData) return rawCsvData.data;
        return null;
      },
    }),
    { 
      name: 'unified-data-store',
      // SSR 환경에서의 hydration 문제를 방지하기 위한 설정
      skipHydration: true
    }
  )
);