// XLSX 다중 시트 지원을 위한 확장된 상태 관리
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as XLSX from 'xlsx';

// 메시지 인터페이스 추가
export interface ChatMessage {
    id: string;
    type: 'user' | 'Extion ai';
    content: string;
    timestamp: Date;
    mode?: 'normal' | 'formula' | 'artifact' | 'datageneration';
    artifactData?: {
        type: string;
        title: string;
        timestamp: Date;
    };
}

// 헤더 정보 인터페이스
interface HeaderInfo {
    column: string; // 열 식별자 (A, B, C 등)
    name: string; // 열 이름
}

// 데이터 범위 인터페이스
interface DataRange {
    startRow: string; // 시작 행
    endRow: string; // 끝 행
    startColumn: string; // 시작 열
    endColumn: string; // 끝 열
}

// 수식 적용 인터페이스
interface FormulaApplication {
    formula: string; // 수식 문자열
    cellAddress: string; // 셀 주소 (예: A1, B2)
    explanation: string; // 수식 설명
    timestamp: Date; // 타임스탬프
}

// 아티팩트 코드 인터페이스
interface ArtifactCode {
    code: string; // 코드 문자열
    type: 'chart' | 'table' | 'analysis'; // 아티팩트 유형
    timestamp: Date; // 타임스탬프
    title?: string; // 제목
    messageId?: string; // 채팅 메시지와 연결하기 위한 ID
}

interface SheetData {
    sheetName: string;
    headers: string[]; // 유효한 헤더만 (공백 제외)
    data: string[][]; // 헤더에 맞춰 정리된 데이터
    rawData?: string[][]; // 원본 데이터 (공백 포함) - 새로 추가
    metadata?: {
        rowCount: number;
        columnCount: number;
        headerRow: number; // 헤더가 위치한 행 번호
        headerRowData?: string[]; // 원본 헤더 행 (공백 포함) - 새로 추가
        headerMap?: { [index: number]: number }; // 원본 인덱스 -> 헤더 인덱스 매핑 - 새로 추가
        dataRange: {
            startRow: number;
            endRow: number;
            startCol: number;
            endCol: number;
            startColLetter: string;
            endColLetter: string;
        };
        preserveOriginalStructure?: boolean; // 원본 구조 유지 플래그 - 새로 추가
        lastModified?: Date;
    };
}

// XLSX 파일 전체 데이터 인터페이스
interface XLSXData {
    fileName: string;
    sheets: SheetData[];
    activeSheetIndex: number; // 현재 활성 시트
}

// 확장된 시트 컨텍스트
interface ExtendedSheetContext {
    sheetName: string;
    sheetIndex: number;
    headers: HeaderInfo[];
    dataRange: DataRange;
    sampleData?: Record<string, string>[];
    totalSheets: number; // 전체 시트 개수
    sheetList: string[]; // 시트 이름 목록
}

// 다중 시트 수식 적용 인터페이스
interface MultiSheetFormulaApplication extends FormulaApplication {
    sheetIndex: number; // 수식이 적용될 시트 인덱스
    crossSheetReference?: boolean; // 다른 시트 참조 여부
}

// 확장된 상태 인터페이스
interface ExtendedUnifiedDataStoreState {
    // === Multi-Sheet Data ===
    xlsxData: XLSXData | null; // XLSX 전체 데이터

    // === Active Sheet Data ===
    activeSheetData: SheetData | null; // 현재 활성 시트 데이터
    computedSheetData: { [sheetIndex: number]: string[][] }; // 시트별 계산된 데이터
    
    // === 시트별 채팅 메시지 ===
    sheetMessages: { [sheetIndex: number]: ChatMessage[] }; // 시트별 메시지
    activeSheetMessages: ChatMessage[]; // 현재 활성 시트의 메시지

    // === Sheet Context ===
    extendedSheetContext: ExtendedSheetContext | null;

    // === Loading States ===
    loadingStates: {
        fileUpload: boolean;
        sheetSwitch: boolean; // 시트 전환 로딩
        formulaGeneration: boolean;
        artifactGeneration: boolean;
        dataGeneration: boolean;
    };

    // === Error States ===
    errors: {
        fileError: string | null;
        sheetError: string | null; // 시트 관련 오류
        formulaError: string | null;
        artifactError: string | null;
        dataGenerationError: string | null;
    };

    // === Multi-Sheet Formula Management ===
    pendingFormula: MultiSheetFormulaApplication | null;
    formulaHistory: MultiSheetFormulaApplication[];

    // === Artifact Management (기존과 동일) ===
    artifactCode: ArtifactCode | null;
    artifactHistory: ArtifactCode[];

    // === Modal State ===
    isArtifactModalOpen: boolean;
    activeArtifactId: string | null;

    // === Sheet Selection Modal ===
    isSheetSelectorOpen: boolean; // 시트 선택 모달

    // === Internal Flags ===
    isInternalUpdate: boolean;
}

// 확장된 액션 인터페이스
interface ExtendedUnifiedDataStoreActions {
    // === XLSX Data Actions ===
    setXLSXData: (data: XLSXData | null) => void;
    setActiveSheet: (sheetIndex: number) => void;
    getSheetByIndex: (index: number) => SheetData | null;
    getSheetByName: (name: string) => SheetData | null;

    // === Sheet Management ===
    switchToSheet: (sheetIndex: number) => void;
    getAllSheetNames: () => string[];
    getCurrentSheetData: () => string[][] | null;

    // === Multi-Sheet Cell Updates ===
    updateCellDataInSheet: (sheetIndex: number, row: number, col: number, value: string) => void;
    updateActiveSheetCell: (row: number, col: number, value: string) => void;

    // === Computed Data Management ===
    setComputedDataForSheet: (sheetIndex: number, data: string[][]) => void;
    getComputedDataForSheet: (sheetIndex: number) => string[][] | null;

    // === Loading Actions ===
    setLoadingState: (type: keyof ExtendedUnifiedDataStoreState['loadingStates'], loading: boolean) => void;

    // === Error Actions ===
    setError: (type: keyof ExtendedUnifiedDataStoreState['errors'], error: string | null) => void;

    // === Multi-Sheet Formula Actions ===
    setPendingFormula: (formula: MultiSheetFormulaApplication | null) => void;
    addToFormulaHistory: (formula: MultiSheetFormulaApplication) => void;
    applyPendingFormulaToSheet: (sheetIndex?: number) => void;

    // === Artifact Actions (기존과 동일) ===
    setArtifactCode: (code: ArtifactCode | null) => void;
    addToArtifactHistory: (artifact: ArtifactCode) => void;

    // === Modal Actions ===
    openSheetSelector: () => void;
    closeSheetSelector: () => void;
    openArtifactModal: (artifactId?: string) => void;
    closeArtifactModal: () => void;

    // === GPT Analysis Support ===
    getDataForGPTAnalysis: (sheetIndex?: number, allSheets?: boolean) => {
        sheets: Array<{
            name: string;
            csv: string;
            metadata: any;
        }>;
        activeSheet: string;
    };

    // === Utility Actions ===
    cellAddressToCoords: (cellAddress: string) => { row: number; col: number };
    coordsToSheetReference: (sheetIndex: number, row: number, col: number) => string;
    resetStore: () => void;

    // === Internal Actions ===
    setInternalUpdate: (flag: boolean) => void;
    updateExtendedSheetContext: () => void;

    // 데이터 생성 결과 적용
    applyGeneratedData: (generatedData: { sheetName: string; headers: string[]; data: string[][]; sheetIndex?: number }) => void;

    // === 시트별 채팅 관련 액션 ===
    addMessageToSheet: (sheetIndex: number, message: ChatMessage) => void;
    getMessagesForSheet: (sheetIndex: number) => ChatMessage[];
    updateActiveSheetMessages: () => void;
    clearMessagesForSheet: (sheetIndex: number) => void;
    clearAllMessages: () => void;
}

// 전체 스토어 타입
type ExtendedUnifiedDataStore = ExtendedUnifiedDataStoreState & ExtendedUnifiedDataStoreActions;

// XLSX 파일을 파싱하는 헬퍼 함수
const parseXLSXFile = async (file: File): Promise<XLSXData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheets: SheetData[] = workbook.SheetNames.map((sheetName: string, index: number) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

                    // 빈 배열 처리
                    if (jsonData.length === 0) {
                        return {
                            sheetName,
                            headers: [],
                            data: [],
                            metadata: {
                                rowCount: 0,
                                columnCount: 0,
                                headerRow: 0,
                                dataRange: {
                                    startRow: 0,
                                    endRow: 0,
                                    startCol: 0,
                                    endCol: 0,
                                    startColLetter: 'A',
                                    endColLetter: 'A'
                                }
                            }
                        };
                    }

                    const headers = jsonData[0] || [];
                    const data = jsonData.slice(1);

                    return {
                        sheetName,
                        headers,
                        data,
                        metadata: {
                            rowCount: data.length,
                            columnCount: headers.length,
                            headerRow: 0,
                            dataRange: {
                                startRow: 1,
                                endRow: data.length,
                                startCol: 0,
                                endCol: headers.length - 1,
                                startColLetter: 'A',
                                endColLetter: String.fromCharCode(65 + headers.length - 1)
                            },
                            lastModified: new Date()
                        }
                    };
                });

                resolve({
                    fileName: file.name,
                    sheets,
                    activeSheetIndex: 0
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(file);
    });
};

// 확장된 시트 컨텍스트 생성
const generateExtendedSheetContext = (xlsxData: XLSXData): ExtendedSheetContext => {
    const activeSheet = xlsxData.sheets[xlsxData.activeSheetIndex];

    if (!activeSheet) {
        throw new Error('활성 시트가 없습니다');
    }

    const headers: HeaderInfo[] = activeSheet.headers.map((header, index) => ({
        column: String.fromCharCode(65 + index),
        name: header
    }));

    const dataRange: DataRange = {
        startRow: '2',
        endRow: (activeSheet.data.length + 1).toString(),
        startColumn: 'A',
        endColumn: String.fromCharCode(64 + activeSheet.headers.length)
    };

    const sampleData = activeSheet.data.slice(0, 3).map(row => {
        const rowData: Record<string, string> = {};
        activeSheet.headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
        });
        return rowData;
    });

    return {
        sheetName: activeSheet.sheetName,
        sheetIndex: xlsxData.activeSheetIndex,
        headers,
        dataRange,
        sampleData,
        totalSheets: xlsxData.sheets.length,
        sheetList: xlsxData.sheets.map(sheet => sheet.sheetName)
    };
};

export const mapOriginalToHeaderCoords = (
    originalRow: number,
    originalCol: number,
    sheetData: SheetData
): { row: number; col: number } | null => {
    if (!sheetData.metadata?.headerMap || !sheetData.metadata?.headerRow) {
        return { row: originalRow, col: originalCol };
    }

    const headerRowIndex = sheetData.metadata.headerRow;
    const headerMap = sheetData.metadata.headerMap;

    // 헤더 행인 경우
    if (originalRow === headerRowIndex) {
        const mappedCol = headerMap[originalCol];
        return mappedCol !== undefined ? { row: 0, col: mappedCol } : null;
    }

    // 데이터 행인 경우
    if (originalRow > headerRowIndex) {
        const mappedCol = headerMap[originalCol];
        const mappedRow = originalRow - headerRowIndex;
        return mappedCol !== undefined ? { row: mappedRow, col: mappedCol } : null;
    }

    return null;
};

// 헤더 좌표를 원본 좌표로 변환
export const mapHeaderToOriginalCoords = (
    headerRow: number,
    headerCol: number,
    sheetData: SheetData
): { row: number; col: number } | null => {
    if (!sheetData.metadata?.headerMap || !sheetData.metadata?.headerRow) {
        return { row: headerRow, col: headerCol };
    }

    const headerRowIndex = sheetData.metadata.headerRow;
    const headerMap = sheetData.metadata.headerMap;

    // headerMap에서 역매핑 찾기
    for (const [originalIndexStr, mappedIndex] of Object.entries(headerMap)) {
        if (mappedIndex === headerCol) {
            const originalCol = parseInt(originalIndexStr);

            // 헤더 행인 경우
            if (headerRow === 0) {
                return { row: headerRowIndex, col: originalCol };
            }

            // 데이터 행인 경우
            return { row: headerRowIndex + headerRow, col: originalCol };
        }
    }

    return null;
};
// 시트 참조 문자열 생성 (예: Sheet1!A1)
const coordsToSheetReference = (
    sheetIndex: number,
    row: number,
    col: number,
    sheetNames: string[]
): string => {
    const sheetName = sheetNames[sheetIndex] || `Sheet${sheetIndex + 1}`;
    const colLetter = String.fromCharCode(65 + col);
    const rowNumber = row + 1;
    return `${sheetName}!${colLetter}${rowNumber}`;
};

// 셀 주소를 좌표로 변환하는 독립적인 유틸리티 함수
export const cellAddressToCoords = (cellAddress: string) => {
    const match = cellAddress.match(/([A-Z]+)([0-9]+)/);
    if (!match) throw new Error(`유효하지 않은 셀 주소: ${cellAddress}`);

    const [, colStr, rowStr] = match;
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 65);
    }
    const row = parseInt(rowStr) - 1;
    return { row, col };
};

// Zustand 스토어 생성
export const useExtendedUnifiedDataStore = create<ExtendedUnifiedDataStore>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            xlsxData: null,
            activeSheetData: null,
            computedSheetData: {},
            extendedSheetContext: null,
            
            // 시트별 메시지 초기화
            sheetMessages: {},
            activeSheetMessages: [],

            loadingStates: {
                fileUpload: false,
                sheetSwitch: false,
                formulaGeneration: false,
                artifactGeneration: false,
                dataGeneration: false,
            },

            errors: {
                fileError: null,
                sheetError: null,
                formulaError: null,
                artifactError: null,
                dataGenerationError: null,
            },

            pendingFormula: null,
            formulaHistory: [],
            artifactCode: null,
            artifactHistory: [],
            isArtifactModalOpen: false,
            activeArtifactId: null,
            isSheetSelectorOpen: false,
            isInternalUpdate: false,

            // XLSX 데이터 액션
            setXLSXData: (data) => {
                set((state) => {
                    if (!data) {
                        return {
                            ...state,
                            xlsxData: null,
                            activeSheetData: null,
                            computedSheetData: {},
                            extendedSheetContext: null,
                            activeSheetMessages: [] // 데이터 없으면 메시지도 초기화
                        };
                    }

                    const activeSheet = data.sheets[data.activeSheetIndex];
                    const newComputedData = { ...state.computedSheetData };

                    // 각 시트에 대한 computed data 초기화
                    data.sheets.forEach((sheet, index) => {
                        if (!newComputedData[index]) {
                            newComputedData[index] = [...sheet.data];
                        }
                    });
                    
                    // 현재 활성 시트의 메시지 불러오기
                    const activeSheetMessages = state.sheetMessages[data.activeSheetIndex] || [];

                    return {
                        ...state,
                        xlsxData: data,
                        activeSheetData: activeSheet,
                        computedSheetData: newComputedData,
                        extendedSheetContext: generateExtendedSheetContext(data),
                        activeSheetMessages
                    };
                });
            },

            // 활성 시트 설정
            setActiveSheet: (sheetIndex) => {
                set((state) => {
                    if (!state.xlsxData || !state.xlsxData.sheets[sheetIndex]) {
                        return state;
                    }

                    const newXlsxData = {
                        ...state.xlsxData,
                        activeSheetIndex: sheetIndex
                    };

                    const activeSheet = newXlsxData.sheets[sheetIndex];
                    const activeSheetMessages = state.sheetMessages[sheetIndex] || [];

                    return {
                        ...state,
                        xlsxData: newXlsxData,
                        activeSheetData: activeSheet,
                        extendedSheetContext: generateExtendedSheetContext(newXlsxData),
                        activeSheetMessages
                    };
                });
            },

            // 시트 전환
            switchToSheet: async (sheetIndex) => {
                const { setLoadingState, setActiveSheet, setError, updateActiveSheetMessages } = get();

                setLoadingState('sheetSwitch', true);
                setError('sheetError', null);

                try {
                    // 약간의 지연을 추가하여 UI 반응성 향상
                    await new Promise(resolve => setTimeout(resolve, 100));
                    setActiveSheet(sheetIndex);
                    // 시트 전환 시 해당 시트의 메시지로 업데이트
                    updateActiveSheetMessages();
                } catch (error) {
                    setError('sheetError', error instanceof Error ? error.message : '시트 전환 실패');
                } finally {
                    setLoadingState('sheetSwitch', false);
                }
            },

            // 인덱스로 시트 가져오기
            getSheetByIndex: (index) => {
                const { xlsxData } = get();
                return xlsxData?.sheets[index] || null;
            },

            // 이름으로 시트 가져오기
            getSheetByName: (name) => {
                const { xlsxData } = get();
                if (!xlsxData) return null;
                return xlsxData.sheets.find(sheet => sheet.sheetName === name) || null;
            },

            // 모든 시트 이름 가져오기
            getAllSheetNames: () => {
                const { xlsxData } = get();
                return xlsxData?.sheets.map(sheet => sheet.sheetName) || [];
            },

            // 현재 시트 데이터 가져오기
            getCurrentSheetData: () => {
                const { xlsxData, computedSheetData } = get();
                if (!xlsxData) return null;

                const activeIndex = xlsxData.activeSheetIndex;
                return computedSheetData[activeIndex] || xlsxData.sheets[activeIndex]?.data || null;
            },

            // 특정 시트의 셀 업데이트
            updateCellDataInSheet: (sheetIndex, row, col, value) => {
                set((state) => {
                    if (!state.xlsxData || !state.xlsxData.sheets[sheetIndex]) {
                        return state;
                    }

                    // xlsxData 업데이트
                    const newXlsxData = { ...state.xlsxData };
                    const targetSheet = { ...newXlsxData.sheets[sheetIndex] };

                    if (targetSheet.data[row]) {
                        targetSheet.data[row] = [...targetSheet.data[row]];
                        targetSheet.data[row][col] = value;
                    }

                    newXlsxData.sheets = [...newXlsxData.sheets];
                    newXlsxData.sheets[sheetIndex] = targetSheet;

                    // computedSheetData 업데이트
                    const newComputedData = { ...state.computedSheetData };
                    if (newComputedData[sheetIndex]) {
                        newComputedData[sheetIndex] = [...newComputedData[sheetIndex]];
                        if (newComputedData[sheetIndex][row]) {
                            newComputedData[sheetIndex][row] = [...newComputedData[sheetIndex][row]];
                            newComputedData[sheetIndex][row][col] = value;
                        }
                    }

                    return {
                        ...state,
                        xlsxData: newXlsxData,
                        computedSheetData: newComputedData,
                        activeSheetData: sheetIndex === state.xlsxData.activeSheetIndex ? targetSheet : state.activeSheetData,
                        extendedSheetContext: generateExtendedSheetContext(newXlsxData)
                    };
                });
            },

            // 활성 시트의 셀 업데이트
            updateActiveSheetCell: (row, col, value) => {
                const { xlsxData, updateCellDataInSheet } = get();
                if (xlsxData) {
                    updateCellDataInSheet(xlsxData.activeSheetIndex, row, col, value);
                }
            },

            // 특정 시트의 computed data 설정
            setComputedDataForSheet: (sheetIndex, data) => {
                set((state) => ({
                    ...state,
                    computedSheetData: {
                        ...state.computedSheetData,
                        [sheetIndex]: data
                    }
                }));
            },

            // 특정 시트의 computed data 가져오기
            getComputedDataForSheet: (sheetIndex) => {
                const { computedSheetData } = get();
                return computedSheetData[sheetIndex] || null;
            },


            // GPT 분석용 데이터 가져오기
            getDataForGPTAnalysis: (sheetIndex, allSheets = false) => {
                const { xlsxData, computedSheetData } = get();

                if (!xlsxData) {
                    return { sheets: [], activeSheet: '' };
                }

                const sheets = [];
                const targetSheets = allSheets
                    ? xlsxData.sheets
                    : sheetIndex !== undefined
                        ? [xlsxData.sheets[sheetIndex]]
                        : [xlsxData.sheets[xlsxData.activeSheetIndex]];

                for (const sheet of targetSheets) {
                    if (!sheet) continue;

                    const sheetIdx = xlsxData.sheets.indexOf(sheet);
                    const currentData = computedSheetData[sheetIdx] || sheet.data;

                    const csv = [sheet.headers, ...currentData]
                        .map(row => row.join(','))
                        .join('\n');

                    // headers가 문자열 배열임을 보장
                    const validHeaders = Array.isArray(sheet.headers)
                        ? sheet.headers.map(h => String(h))
                        : [];

                    // sampleData를 문자열 배열로 변환
                    const sampleData = currentData.slice(0, 5).map(row =>
                        Array.isArray(row) ? row.map(cell => String(cell || '')) : []
                    );

                    sheets.push({
                        name: sheet.sheetName,
                        csv,
                        metadata: {
                            headers: validHeaders,               // 문자열 배열 보장
                            rowCount: currentData.length,
                            columnCount: validHeaders.length,
                            sampleData: sampleData,              // 2차원 문자열 배열
                            sheetIndex: sheetIdx
                        }
                    });
                }

                return {
                    sheets,
                    activeSheet: xlsxData.sheets[xlsxData.activeSheetIndex].sheetName
                };
            },

            // 로딩 상태 설정
            setLoadingState: (type, loading) =>
                set((state) => ({
                    loadingStates: { ...state.loadingStates, [type]: loading }
                })),

            // 오류 설정
            setError: (type, error) =>
                set((state) => ({
                    errors: { ...state.errors, [type]: error }
                })),

            // 다중 시트 수식 관리
            setPendingFormula: (formula) => set({ pendingFormula: formula }),

            addToFormulaHistory: (formula) =>
                set((state) => ({
                    formulaHistory: [...state.formulaHistory, formula]
                })),

            applyPendingFormulaToSheet: (sheetIndex) => {
                const { pendingFormula, xlsxData, computedSheetData, cellAddressToCoords } = get();

                if (!pendingFormula || !xlsxData) return;

                const targetSheetIndex = sheetIndex ?? pendingFormula.sheetIndex ?? xlsxData.activeSheetIndex;
                const targetSheet = xlsxData.sheets[targetSheetIndex];

                if (!targetSheet) {
                    get().setError('formulaError', `시트 인덱스 ${targetSheetIndex}를 찾을 수 없습니다`);
                    return;
                }

                try {
                    const { row, col } = cellAddressToCoords(pendingFormula.cellAddress);
                    const newComputedData = { ...computedSheetData };

                    if (!newComputedData[targetSheetIndex]) {
                        newComputedData[targetSheetIndex] = [...targetSheet.data];
                    }

                    if (!newComputedData[targetSheetIndex][row]) {
                        newComputedData[targetSheetIndex][row] = new Array(targetSheet.headers.length).fill('');
                    }

                    newComputedData[targetSheetIndex][row][col] = pendingFormula.formula;

                    set({
                        computedSheetData: newComputedData,
                        pendingFormula: null
                    });

                } catch (error) {
                    get().setError('formulaError', error instanceof Error ? error.message : '수식 적용 실패');
                }
            },

            // 아티팩트 관리 (기존과 동일)
            setArtifactCode: (code) => set({ artifactCode: code }),
            addToArtifactHistory: (artifact) => {
                set((state) => ({
                    artifactHistory: [...state.artifactHistory, artifact],
                    artifactCode: artifact,
                    activeArtifactId: artifact.messageId || null
                }));
            },

            // 모달 관리
            openSheetSelector: () => set({ isSheetSelectorOpen: true }),
            closeSheetSelector: () => set({ isSheetSelectorOpen: false }),
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

            // 유틸리티 함수
            cellAddressToCoords: (cellAddress: string) => {
                return cellAddressToCoords(cellAddress);
            },

            coordsToSheetReference: (sheetIndex, row, col) => {
                const { xlsxData } = get();
                if (!xlsxData) return '';
                return coordsToSheetReference(sheetIndex, row, col, xlsxData.sheets.map(s => s.sheetName));
            },

            // 내부 상태 관리
            setInternalUpdate: (flag) => set({ isInternalUpdate: flag }),

            updateExtendedSheetContext: () => {
                const { xlsxData } = get();
                if (xlsxData) {
                    set({ extendedSheetContext: generateExtendedSheetContext(xlsxData) });
                }
            },

            // 스토어 리셋
            resetStore: () => {
                set({
                    xlsxData: null,
                    activeSheetData: null,
                    computedSheetData: {},
                    extendedSheetContext: null,
                    sheetMessages: {},
                    activeSheetMessages: [],
                    loadingStates: {
                        fileUpload: false,
                        sheetSwitch: false,
                        formulaGeneration: false,
                        artifactGeneration: false,
                        dataGeneration: false,
                    },
                    errors: {
                        fileError: null,
                        sheetError: null,
                        formulaError: null,
                        artifactError: null,
                        dataGenerationError: null,
                    },
                    pendingFormula: null,
                    formulaHistory: [],
                    artifactCode: null,
                    artifactHistory: [],
                    isArtifactModalOpen: false,
                    activeArtifactId: null,
                    isSheetSelectorOpen: false,
                    isInternalUpdate: false,
                });
            },

            // 데이터 생성 결과 적용
            applyGeneratedData: (generatedData) => {
                const { xlsxData } = get();
                
                // 파일이 없는 경우 새 파일 생성
                if (!xlsxData) {
                    const newXlsxData = {
                        fileName: 'generated_data.xlsx',
                        sheets: [{
                            sheetName: generatedData.sheetName || 'Sheet1',
                            headers: generatedData.headers,
                            data: generatedData.data,
                            rawData: [generatedData.headers, ...generatedData.data],
                            metadata: {
                                rowCount: generatedData.data.length,
                                columnCount: generatedData.headers.length,
                                headerRow: 0,
                                dataRange: {
                                    startRow: 1,
                                    endRow: generatedData.data.length,
                                    startCol: 0,
                                    endCol: generatedData.headers.length - 1,
                                    startColLetter: 'A',
                                    endColLetter: String.fromCharCode(65 + generatedData.headers.length - 1)
                                },
                                headerRowData: generatedData.headers,
                                headerMap: generatedData.headers.reduce((acc: Record<number, number>, header, idx) => {
                                    acc[idx] = idx;
                                    return acc;
                                }, {}),
                                preserveOriginalStructure: true,
                                lastModified: new Date()
                            }
                        }],
                        activeSheetIndex: 0
                    };
                    
                    set((state) => {
                        return {
                            ...state,
                            xlsxData: newXlsxData,
                            activeSheetData: newXlsxData.sheets[0],
                            computedSheetData: { 0: [...generatedData.data] },
                            extendedSheetContext: generateExtendedSheetContext(newXlsxData)
                        };
                    });
                    
                    return;
                }
                
                // 기존 파일에 데이터 업데이트 또는 새 시트 추가
                const sheetIndex = generatedData.sheetIndex !== undefined 
                    ? generatedData.sheetIndex 
                    : xlsxData.activeSheetIndex;
                
                // 기존 시트가 있는지 확인
                if (sheetIndex < xlsxData.sheets.length) {
                    // 기존 시트 업데이트
                    const newXlsxData = { ...xlsxData };
                    const targetSheet = { ...newXlsxData.sheets[sheetIndex] };
                    
                    targetSheet.headers = generatedData.headers;
                    targetSheet.data = generatedData.data;
                    targetSheet.rawData = [generatedData.headers, ...generatedData.data];
                    
                    // metadata가 확실히 존재하도록 설정
                    if (!targetSheet.metadata) {
                        targetSheet.metadata = {
                            rowCount: generatedData.data.length,
                            columnCount: generatedData.headers.length,
                            headerRow: 0,
                            dataRange: {
                                startRow: 1,
                                endRow: generatedData.data.length,
                                startCol: 0,
                                endCol: generatedData.headers.length - 1,
                                startColLetter: 'A',
                                endColLetter: String.fromCharCode(65 + generatedData.headers.length - 1)
                            },
                            headerRowData: generatedData.headers,
                            headerMap: generatedData.headers.reduce((acc: Record<number, number>, header, idx) => {
                                acc[idx] = idx;
                                return acc;
                            }, {}),
                            preserveOriginalStructure: true,
                            lastModified: new Date()
                        };
                    } else {
                        targetSheet.metadata = {
                            ...targetSheet.metadata,
                            rowCount: generatedData.data.length,
                            columnCount: generatedData.headers.length,
                            headerRow: 0,
                            headerRowData: generatedData.headers,
                            headerMap: generatedData.headers.reduce((acc: Record<number, number>, header, idx) => {
                                acc[idx] = idx;
                                return acc;
                            }, {}),
                            dataRange: {
                                ...targetSheet.metadata.dataRange,
                                endRow: generatedData.data.length,
                                endCol: generatedData.headers.length - 1,
                                endColLetter: String.fromCharCode(65 + generatedData.headers.length - 1)
                            },
                            lastModified: new Date()
                        };
                    }
                    
                    newXlsxData.sheets[sheetIndex] = targetSheet;
                    
                    set((state) => {
                        return {
                            ...state,
                            xlsxData: newXlsxData,
                            activeSheetData: sheetIndex === newXlsxData.activeSheetIndex ? targetSheet : state.activeSheetData,
                            computedSheetData: {
                                ...state.computedSheetData,
                                [sheetIndex]: [...generatedData.data]
                            },
                            extendedSheetContext: generateExtendedSheetContext(newXlsxData)
                        };
                    });
                } else {
                    // 새 시트 추가
                    const newSheet = {
                        sheetName: generatedData.sheetName || `Sheet${xlsxData.sheets.length + 1}`,
                        headers: generatedData.headers,
                        data: generatedData.data,
                        rawData: [generatedData.headers, ...generatedData.data],
                        metadata: {
                            rowCount: generatedData.data.length,
                            columnCount: generatedData.headers.length,
                            headerRow: 0,
                            dataRange: {
                                startRow: 1,
                                endRow: generatedData.data.length,
                                startCol: 0,
                                endCol: generatedData.headers.length - 1,
                                startColLetter: 'A',
                                endColLetter: String.fromCharCode(65 + generatedData.headers.length - 1)
                            },
                            headerRowData: generatedData.headers,
                            headerMap: generatedData.headers.reduce((acc: Record<number, number>, header, idx) => {
                                acc[idx] = idx;
                                return acc;
                            }, {}),
                            preserveOriginalStructure: true,
                            lastModified: new Date()
                        }
                    };
                    
                    const newXlsxData = {
                        ...xlsxData,
                        sheets: [...xlsxData.sheets, newSheet],
                        activeSheetIndex: xlsxData.sheets.length
                    };
                    
                    set((state) => {
                        return {
                            ...state,
                            xlsxData: newXlsxData,
                            activeSheetData: newSheet,
                            computedSheetData: {
                                ...state.computedSheetData,
                                [xlsxData.sheets.length]: [...generatedData.data]
                            },
                            extendedSheetContext: generateExtendedSheetContext(newXlsxData)
                        };
                    });
                }
            },

            // 시트별 채팅 관련 액션
            addMessageToSheet: (sheetIndex, message) => {
                set((state) => {
                    const sheetMessages = { ...state.sheetMessages };
                    const currentMessages = [...(sheetMessages[sheetIndex] || [])];
                    
                    currentMessages.push(message);
                    sheetMessages[sheetIndex] = currentMessages;
                    
                    // 현재 활성 시트의 메시지인 경우 activeSheetMessages도 업데이트
                    const activeSheetMessages = 
                        state.xlsxData?.activeSheetIndex === sheetIndex
                            ? currentMessages
                            : state.activeSheetMessages;
                    
                    return {
                        ...state,
                        sheetMessages,
                        activeSheetMessages
                    };
                });
            },
            
            getMessagesForSheet: (sheetIndex) => {
                return get().sheetMessages[sheetIndex] || [];
            },
            
            updateActiveSheetMessages: () => {
                set((state) => {
                    if (!state.xlsxData) return state;
                    
                    const activeSheetIndex = state.xlsxData.activeSheetIndex;
                    const activeSheetMessages = state.sheetMessages[activeSheetIndex] || [];
                    
                    return {
                        ...state,
                        activeSheetMessages
                    };
                });
            },
            
            clearMessagesForSheet: (sheetIndex) => {
                set((state) => {
                    const sheetMessages = { ...state.sheetMessages };
                    sheetMessages[sheetIndex] = [];
                    
                    // 현재 활성 시트의 메시지인 경우 activeSheetMessages도 초기화
                    const activeSheetMessages = 
                        state.xlsxData?.activeSheetIndex === sheetIndex
                            ? []
                            : state.activeSheetMessages;
                    
                    return {
                        ...state,
                        sheetMessages,
                        activeSheetMessages
                    };
                });
            },
            
            clearAllMessages: () => {
                set((state) => ({
                    ...state,
                    sheetMessages: {},
                    activeSheetMessages: []
                }));
            },
        }),
        {
            name: 'extended-unified-data-store',
            skipHydration: true
        }
    )
);

// 편의 훅들
export const useActiveSheet = () => {
    const activeSheetData = useExtendedUnifiedDataStore(state => state.activeSheetData);
    const activeSheetIndex = useExtendedUnifiedDataStore(state => state.xlsxData?.activeSheetIndex);
    return { activeSheetData, activeSheetIndex };
};

export const useSheetList = () => {
    return useExtendedUnifiedDataStore(state =>
        state.xlsxData?.sheets.map((sheet, index) => ({
            name: sheet.sheetName,
            index,
            isActive: index === state.xlsxData?.activeSheetIndex
        })) || []
    );
};

// 타입 export
export type {
    SheetData,
    XLSXData,
    ExtendedSheetContext,
    MultiSheetFormulaApplication
};

// 유틸리티 함수 export
export { parseXLSXFile, coordsToSheetReference };
