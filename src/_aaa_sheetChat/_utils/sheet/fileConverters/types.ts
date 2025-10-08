// 파일 변환 관련 타입 정의

export interface ConvertedFileResult {
    fileName: string;
    originalType: string;
    spreadsheetData?: any;
    content?: any;
    data?: any;
    error?: string;
    timestamp: string;
    fileExtension?: string;
}

export interface FileConverterOptions {
    includeBindingSource?: boolean;
    ignoreFormula?: boolean;
    ignoreStyle?: boolean;
    saveAsView?: boolean;
    rowHeadersAsFrozenColumns?: boolean;
    columnHeadersAsFrozenRows?: boolean;
    includeAutoMergedCells?: boolean;
    saveR1C1Formula?: boolean;
}

export const DEFAULT_CONVERTER_OPTIONS: FileConverterOptions = {
    includeBindingSource: true,
    ignoreFormula: false,
    ignoreStyle: false,
    saveAsView: true,
    rowHeadersAsFrozenColumns: true,
    columnHeadersAsFrozenRows: true,
    includeAutoMergedCells: true,
    saveR1C1Formula: true,
};