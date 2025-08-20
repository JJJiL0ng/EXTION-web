// 델타 관련 타입 정의
export enum DeltaAction {
  SET_CELL_VALUE = "SET_CELL_VALUE",
  SET_CELL_FORMULA = "SET_CELL_FORMULA", 
  SET_CELL_STYLE = "SET_CELL_STYLE",
  DELETE_CELLS = "DELETE_CELLS",
  INSERT_ROWS = "INSERT_ROWS",
  DELETE_ROWS = "DELETE_ROWS",
  INSERT_COLUMNS = "INSERT_COLUMNS",
  DELETE_COLUMNS = "DELETE_COLUMNS",
  ADD_SHEET = "ADD_SHEET",
  DELETE_SHEET = "DELETE_SHEET",
  RENAME_SHEET = "RENAME_SHEET"
}

export interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  border?: {
    top?: { style: string; color: string; width: number };
    right?: { style: string; color: string; width: number };
    bottom?: { style: string; color: string; width: number };
    left?: { style: string; color: string; width: number };
  };
}

export interface CellDelta {
  action: DeltaAction;
  sheetName: string;
  cellAddress?: string;
  range?: string;
  value?: any;
  formula?: string;
  style?: CellStyle;
  rowIndex?: number;
  columnIndex?: number;
  count?: number;
  timestamp: number;
}

export interface DeltaState {
  isPending: boolean;
  isProcessing: boolean;
  lastSyncAt: string | null;
  queuedDeltas: number;
  failedDeltas: CellDelta[];
  error: string | null;
}

export interface DeltaBatch {
  deltas: CellDelta[];
  createdAt: number;
  retryCount: number;
}

export interface SpreadJSFormat {
  version?: string;
  name?: string;
  sheetCount?: number;
  sheets: {
    [sheetName: string]: {
      name: string;
      rowCount?: number;
      columnCount?: number;
      data: {
        dataTable: {
          [rowIndex: string]: {
            [colIndex: string]: {
              value?: any;
              formula?: string;
              style?: any;
            };
          };
        };
      };
    };
  };
}

export interface SpreadSheetStructure {
  version: string;
  sheets: {
    [sheetName: string]: {
      name: string;
      data: {
        dataTable: {
          [cellAddress: string]: {
            value?: string | number | boolean | null;
            formula?: string;
            style?: CellStyle;
          };
        };
      };
    };
  };
}