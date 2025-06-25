// 선택된 셀 정보 인터페이스
export interface SelectedCellInfo {
  row: number;
  col: number;
  cellAddress: string;
  value: any;
  formula?: string;
  sheetIndex: number;
  timestamp: Date;
} 