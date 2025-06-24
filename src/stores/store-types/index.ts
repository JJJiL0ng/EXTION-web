// 공통 타입 정의
import { EditedDataDto, ChangesDto } from '@/services/api/dataServices';

export interface ChatMessage {
    id: string;
    type: 'user' | 'Extion ai';
    content: string;
    timestamp: Date;
    mode?: 'normal' | 'formula' | 'artifact' | 'datafix';
    artifactData?: {
        type: string;
        title: string;
        timestamp: Date;
        code?: string;
        artifactId?: string;
        explanation?: string;
    };
    dataFixData?: {
        editedData: EditedDataDto;
        sheetIndex?: number;
        changes?: ChangesDto;
        isApplied?: boolean;
    };
}

// 수식 적용 인터페이스
export interface FormulaApplication {
    formula: string; // 수식 문자열
    cellAddress: string; // 셀 주소 (예: A1, B2)
    explanation: string; // 수식 설명
    timestamp: Date; // 타임스탬프
}

// 아티팩트 코드 인터페이스
export interface ArtifactCode {
    code: string; // 코드 문자열
    type: 'chart' | 'table' | 'analysis'; // 아티팩트 유형
    timestamp: Date; // 타임스탬프
    title?: string; // 제목
    messageId?: string; // 채팅 메시지와 연결하기 위한 ID
}

// 시트 데이터 인터페이스
export interface SheetData {
    sheetTableDataId?: string; // 데이터베이스의 SheetTableData ID
    sheetName: string;
    rawData?: string[][]; // 원본 데이터 (공백 포함)
    metadata?: {
        rowCount: number;
        columnCount: number;
        dataRange: {
            startRow: number;
            endRow: number;
            startCol: number;
            endCol: number;
            startColLetter: string;
            endColLetter: string;
        };
        preserveOriginalStructure?: boolean; // 원본 구조 유지 플래그
        lastModified?: Date;
    };
}

// XLSX 파일 전체 데이터 인터페이스
export interface XLSXData {
    fileName: string;
    sheets: SheetData[];
    activeSheetIndex: number; // 현재 활성 시트
    sheetMetaDataId?: string; // 데이터베이스의 SheetMetaData ID
}

// 다중 시트 수식 적용 인터페이스
export interface MultiSheetFormulaApplication extends FormulaApplication {
    sheetIndex: number; // 수식이 적용될 시트 인덱스
    crossSheetReference?: boolean; // 다른 시트 참조 여부
}

// 스프레드시트 메타데이터
export interface SpreadsheetMetadata {
    fileName?: string;
    originalFileName?: string;
    fileSize?: number;
    fileType?: 'xlsx' | 'csv';
    lastSaved?: Date;
    isSaved?: boolean;
}

// 채팅 세션 인터페이스
export interface ChatSession {
    chatId: string;
    chatTitle?: string;
    xlsxData: XLSXData | null;
    activeSheetData: SheetData | null;
    computedSheetData: { [sheetIndex: number]: string[][] };
    sheetMessages: { [sheetIndex: number]: ChatMessage[] };
    activeSheetMessages: ChatMessage[];
    sheetChatIds: { [sheetIndex: number]: string };
    hasUploadedFile: boolean;
    createdAt: Date;
    lastAccessedAt: Date;
    currentSheetMetaDataId: string | null;
    sheetMetaData: SpreadsheetMetadata | null;
    currentSheetTableDataId?: string | null; // 데이터베이스의 SheetTableData ID
}

// 로딩 상태 타입
export interface LoadingStates {
    fileUpload: boolean;
    sheetSwitch: boolean;
    formulaGeneration: boolean;
    artifactGeneration: boolean;
    dataGeneration: boolean;
    dataFix: boolean;
}

// 오류 상태 타입
export interface ErrorStates {
    fileError: string | null;
    sheetError: string | null;
    formulaError: string | null;
    artifactError: string | null;
    dataGenerationError: string | null;
    dataFixError: string | null;
} 