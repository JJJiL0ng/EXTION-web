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

// Handsontable 설정 인터페이스
export interface HandsontableSettings {
  minRows: number;
  minCols: number;
  startRows: number;
  startCols: number;
  maxRows: number;
  maxCols: number;
}

// 내보내기 관련 타입
export interface ExportState {
  isExportDropdownOpen: boolean;
  isXlsxSelectorOpen: boolean;
  selectedSheets: number[];
  exportFileName: string;
}

// 시트 탭 관련 타입
export interface SheetTabsState {
  isSheetDropdownOpen: boolean;
  isCreateSheetModalOpen: boolean;
  newSheetName: string;
  scrollThumbPosition: number;
  scrollThumbWidth: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartScroll: number;
  showScrollbar: boolean;
}

// 셀 편집 관련 타입
export interface CellEditState {
  cellEditValue: string;
  isCellEditing: boolean;
} 