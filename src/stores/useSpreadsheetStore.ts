// stores/useSpreadsheetStore.ts
import { create } from 'zustand';

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

interface SheetContext {
  sheetName: string;
  headers: HeaderInfo[];
  dataRange: DataRange;
  sampleData?: Record<string, string>[];
}

interface FormulaApplication {
  formula: string;
  cellAddress: string;
  explanation: string;
  timestamp: Date;
}

interface SpreadsheetStore {
  sheetContext: SheetContext | null;
  pendingFormula: FormulaApplication | null;
  updateSheetContext: (csvData: { headers: string[]; data: string[][] } | null) => void;
  setPendingFormula: (formula: FormulaApplication | null) => void;
  applyPendingFormula: () => void;
}

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

export const useSpreadsheetStore = create<SpreadsheetStore>((set, get) => ({
  sheetContext: null,
  pendingFormula: null,
  
  updateSheetContext: (csvData) => {
    if (!csvData || !csvData.headers || !csvData.data) {
      set({ sheetContext: null });
      return;
    }

    // CSV 데이터를 SheetContext 형태로 변환
    const headers: HeaderInfo[] = csvData.headers.map((header, index) => ({
      column: String.fromCharCode(65 + index), // A, B, C, ...
      name: header
    }));

    // 데이터 범위 계산 (헤더 제외)
    const dataRange: DataRange = {
      startRow: '2', // 헤더가 1행이므로 데이터는 2행부터
      endRow: (csvData.data.length + 1).toString(), // 데이터 마지막 행
      startColumn: 'A',
      endColumn: String.fromCharCode(64 + csvData.headers.length) // 마지막 컬럼
    };

    // 샘플 데이터 생성 (처음 3행)
    const sampleData = csvData.data.slice(0, 3).map(row => {
      const rowData: Record<string, string> = {};
      csvData.headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });
      return rowData;
    });

    const sheetContext: SheetContext = {
      sheetName: 'Sheet1', // 기본값
      headers,
      dataRange,
      sampleData
    };

    set({ sheetContext });
  },

  setPendingFormula: (formula) => {
    set({ pendingFormula: formula });
  },

  applyPendingFormula: () => {
    const { pendingFormula } = get();
    if (pendingFormula) {
      // 실제 적용은 MainSpreadSheet 컴포넌트에서 처리
      // 여기서는 상태만 관리
      console.log('Formula application triggered', pendingFormula);
    }
  },
}));

export { cellAddressToCoords };