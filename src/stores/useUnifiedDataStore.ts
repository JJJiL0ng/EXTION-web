// stores/useUnifiedDataStore.ts (아티팩트 모달 상태 추가)
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
  title?: string;
  messageId?: string; // 채팅 메시지와 연결하기 위한 ID
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
  artifactHistory: ArtifactCode[]; // 생성된 아티팩트들의 히스토리
  
  // === Modal State ===
  isArtifactModalOpen: boolean;
  activeArtifactId: string | null; // 현재 모달에서 보고 있는 아티팩트 ID
  
  // === Internal Flags ===
  isInternalUpdate: boolean;
}

interface UnifiedDataStoreActions {
  // === CSV Data Actions ===
  setRawCsvData: (data: CSVData | null) => void;
  updateCellData: (row: number, col: number, value: string) => void;
  setComputedData: (data: string[][] | null) => void;
  
  // === Loading Actions ===
  setLoadingState: (type: keyof UnifiedDataStoreState['loadingStates'], loading: boolean) => void;
  
  // === Error Actions ===
  setError: (type: keyof UnifiedDataStoreState['errors'], error: string | null) => void;
  
  // === Formula Actions ===
  setPendingFormula: (formula: FormulaApplication | null) => void;
  addToFormulaHistory: (formula: FormulaApplication) => void;
  clearFormulaHistory: () => void;
  applyPendingFormula: () => void;
  
  // === Artifact Actions ===
  setArtifactCode: (code: ArtifactCode | null) => void;
  addToArtifactHistory: (artifact: ArtifactCode) => void;
  clearArtifactHistory: () => void;
  
  // === Modal Actions ===
  openArtifactModal: (artifactId?: string) => void;
  closeArtifactModal: () => void;
  setActiveArtifact: (artifactId: string | null) => void;
  
  // === Internal Actions ===
  setInternalUpdate: (flag: boolean) => void;
  
  // === Computed Actions ===
  updateSheetContext: () => void;
  getCurrentData: () => string[][] | null;
  getArtifactById: (id: string) => ArtifactCode | null;
  
  // === Utility Actions ===
  cellAddressToCoords: (cellAddress: string) => { row: number; col: number };
  resetStore: () => void;
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

// 셀 주소를 행과 열 인덱스로 변환하는 함수
const cellAddressToCoords = (cellAddress: string): { row: number; col: number } => {
  const match = cellAddress.match(/([A-Z]+)([0-9]+)/);
  if (!match) throw new Error(`Invalid cell address: ${cellAddress}`);
  
  const [, colStr, rowStr] = match;
  
  // 컬럼 문자를 숫자로 변환 (A=0, B=1, ...)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65);
  }
  
  // 행은 0-based index로 변환 (1-based에서 0-based로)
  const row = parseInt(rowStr) - 1;
  
  return { row, col };
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
      artifactHistory: [],
      isArtifactModalOpen: false,
      activeArtifactId: null,
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
      
      applyPendingFormula: () => {
        const { pendingFormula, computedData, rawCsvData } = get();
        if (!pendingFormula || !computedData || !rawCsvData) return;
        
        try {
          const { row, col } = cellAddressToCoords(pendingFormula.cellAddress);
          
          const formulaValue = pendingFormula.formula;
          
          // 셀 업데이트
          const newComputedData = [...computedData];
          if (!newComputedData[row]) {
            newComputedData[row] = new Array(rawCsvData.headers.length).fill('');
          }
          newComputedData[row][col] = formulaValue;
          
          set({
            computedData: newComputedData,
            pendingFormula: null
          });
          
          console.log('Formula applied successfully', {
            formula: formulaValue,
            cellAddress: pendingFormula.cellAddress,
            row,
            col
          });
        } catch (error) {
          console.error('Failed to apply formula:', error);
          set({
            errors: { 
              ...get().errors, 
              formulaError: error instanceof Error ? error.message : 'Formula application failed'
            }
          });
        }
      },
      
      // Artifact Actions
      setArtifactCode: (code) => set({ artifactCode: code }),
      
      addToArtifactHistory: (artifact) => {
        set((state) => ({
          artifactHistory: [...state.artifactHistory, artifact],
          artifactCode: artifact,
          activeArtifactId: artifact.messageId || null
        }));
      },
      
      clearArtifactHistory: () => set({ artifactHistory: [] }),
      
      // Modal Actions
      openArtifactModal: (artifactId) => {
        set((state) => ({
          isArtifactModalOpen: true,
          activeArtifactId: artifactId || state.activeArtifactId
        }));
      },
      
      closeArtifactModal: () => {
        set({
          isArtifactModalOpen: false,
          activeArtifactId: null
        });
      },
      
      setActiveArtifact: (artifactId) => {
        const artifact = artifactId ? get().getArtifactById(artifactId) : null;
        set({
          activeArtifactId: artifactId,
          artifactCode: artifact
        });
      },
      
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
      
      getArtifactById: (id) => {
        const { artifactHistory } = get();
        return artifactHistory.find(artifact => artifact.messageId === id) || null;
      },
      
      // Utility Actions
      cellAddressToCoords,
      
      resetStore: () => {
        set({
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
          artifactHistory: [],
          isArtifactModalOpen: false,
          activeArtifactId: null,
          isInternalUpdate: false,
        });
      },
    }),
    { 
      name: 'unified-data-store',
      skipHydration: true
    }
  )
);

// 타입 export
export type { 
  CSVData, 
  SheetContext, 
  HeaderInfo, 
  DataRange, 
  FormulaApplication, 
  ArtifactCode 
};