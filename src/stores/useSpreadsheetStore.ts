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

interface SpreadsheetStore {
  sheetContext: SheetContext | null;
  updateSheetContext: (csvData: { headers: string[]; data: string[][] } | null) => void;
}

export const useSpreadsheetStore = create<SpreadsheetStore>((set) => ({
  sheetContext: null,
  
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
}));