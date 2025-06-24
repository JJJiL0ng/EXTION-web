import { StateCreator } from 'zustand';
import { XLSXData, SheetData, SpreadsheetMetadata, LoadingStates, ErrorStates } from '../store-types';
import { coordsToSheetReference, cellAddressToCoords } from '../store-utils/xlsxUtils';

// 스프레드시트 슬라이스 상태
export interface SpreadsheetSlice {
    // === 데이터 상태 ===
    xlsxData: XLSXData | null;
    activeSheetData: SheetData | null;
    computedSheetData: { [sheetIndex: number]: string[][] };
    
    // === 스프레드시트 메타데이터 ===
    sheetMetaData: SpreadsheetMetadata | null;
    hasUploadedFile: boolean;
    
    // === 시트 저장 상태 ===
    saveStatus: 'synced' | 'modified' | 'saving' | 'error';
    setSaveStatus: (status: 'synced' | 'modified' | 'saving' | 'error') => void;
    
    // === 액션들 ===
    // XLSX 데이터 관리
    setXLSXData: (data: XLSXData | null) => void;
    setActiveSheet: (sheetIndex: number) => void;
    getSheetByIndex: (index: number) => SheetData | null;
    getSheetByName: (name: string) => SheetData | null;
    
    // 시트 관리
    switchToSheet: (sheetIndex: number) => void;
    getAllSheetNames: () => string[];
    getCurrentSheetData: () => string[][] | null;
    
    // 셀 데이터 업데이트
    updateCellDataInSheet: (sheetIndex: number, row: number, col: number, value: string) => void;
    updateActiveSheetCell: (row: number, col: number, value: string) => void;
    
    // Computed 데이터 관리
    setComputedDataForSheet: (sheetIndex: number, data: string[][]) => void;
    getComputedDataForSheet: (sheetIndex: number) => string[][] | null;
    
    // 시트 메타데이터 관리
    setSheetMetaData: (metadata: SpreadsheetMetadata | null) => void;
    getSheetMetaData: () => SpreadsheetMetadata | null;
    markAsSaved: (sheetMetaDataId: string) => void;
    markAsUnsaved: () => void;
    
    // 파일 업로드 관리
    markFileAsUploaded: () => void;
    canUploadFile: () => boolean;
    
    // 유틸리티
    cellAddressToCoords: (cellAddress: string) => { row: number; col: number };
    coordsToSheetReference: (sheetIndex: number, row: number, col: number) => string;
    
    // 시트 테이블 데이터 ID 관리
    updateSheetTableDataIds: (sheetsInfo: Array<{
        sheetTableDataId: string;
        sheetIndex: number;
        sheetName: string;
        headers: string[];
        rowCount: number;
    }>) => void;
    getSheetTableDataIdByIndex: (sheetIndex: number) => string | null;
    updateSheetTableDataIdByIndex: (sheetIndex: number, sheetTableDataId: string) => void;
    
    // GPT 분석용 데이터
    getDataForGPTAnalysis: (sheetIndex?: number, allSheets?: boolean) => {
        sheets: Array<{
            name: string;
            csv: string;
            metadata: any;
        }>;
        activeSheet: string;
        currentSheetIndex?: number;
        totalSheets?: number;
        fileName?: string;
        sheetMetaDataId?: string;
    };
    
    // 데이터 생성 결과 적용
    applyGeneratedData: (generatedData: { 
        sheetName: string; 
        data: string[][]; 
        sheetIndex?: number 
    }) => void;
}

// 스프레드시트 슬라이스 생성자
export const createSpreadsheetSlice: StateCreator<
    SpreadsheetSlice & { loadingStates: LoadingStates; errors: ErrorStates; setLoadingState: any; setError: any; currentSheetMetaDataId: string | null },
    [],
    [],
    SpreadsheetSlice
> = (set, get) => ({
    // === 초기 상태 ===
    xlsxData: null,
    activeSheetData: null,
    computedSheetData: {},
    sheetMetaData: null,
    hasUploadedFile: false,
    saveStatus: 'synced',
    
    // === 시트 저장 상태 액션 ===
    setSaveStatus: (status) => set({ saveStatus: status }),

    // === XLSX 데이터 액션들 ===
    setXLSXData: (data) => {
        set((state) => {
            if (!data) {
                return {
                    ...state,
                    xlsxData: null,
                    activeSheetData: null,
                    computedSheetData: {},
                };
            }

            const activeSheet = data.sheets[data.activeSheetIndex];
            const newComputedData = { ...state.computedSheetData };

            // 각 시트에 대한 computed data 초기화
            data.sheets.forEach((sheet, index) => {
                if (!newComputedData[index]) {
                    newComputedData[index] = [...(sheet.rawData || [])];
                }
            });

            return {
                ...state,
                xlsxData: data,
                hasUploadedFile: true,
                activeSheetData: activeSheet,
                computedSheetData: newComputedData,
            };
        });
    },

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

            return {
                ...state,
                xlsxData: newXlsxData,
                activeSheetData: activeSheet,
            };
        });
    },

    switchToSheet: async (sheetIndex) => {
        const { setLoadingState, setActiveSheet, setError } = get();

        setLoadingState('sheetSwitch', true);
        setError('sheetError', null);

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            setActiveSheet(sheetIndex);
        } catch (error) {
            setError('sheetError', error instanceof Error ? error.message : '시트 전환 실패');
        } finally {
            setLoadingState('sheetSwitch', false);
        }
    },

    getSheetByIndex: (index) => {
        const { xlsxData } = get();
        return xlsxData?.sheets[index] || null;
    },

    getSheetByName: (name) => {
        const { xlsxData } = get();
        if (!xlsxData) return null;
        return xlsxData.sheets.find(sheet => sheet.sheetName === name) || null;
    },

    getAllSheetNames: () => {
        const { xlsxData } = get();
        return xlsxData?.sheets.map(sheet => sheet.sheetName) || [];
    },

    getCurrentSheetData: () => {
        const { xlsxData, computedSheetData } = get();
        if (!xlsxData) return null;

        const activeIndex = xlsxData.activeSheetIndex;
        return computedSheetData[activeIndex] || xlsxData.sheets[activeIndex]?.rawData || null;
    },

    updateCellDataInSheet: (sheetIndex, row, col, value) => {
        set((state) => {
            if (!state.xlsxData || !state.xlsxData.sheets[sheetIndex]) {
                return state;
            }

            // xlsxData의 rawData 업데이트
            const newXlsxData = { ...state.xlsxData };
            const targetSheet = { ...newXlsxData.sheets[sheetIndex] };
            
            // rawData를 깊은 복사하여 불변성 유지
            const newRawData = (targetSheet.rawData || []).map(r => [...(r || [])]);

            // 행과 열이 범위를 벗어날 경우 확장
            while (newRawData.length <= row) {
                newRawData.push([]);
            }
            const targetRow = newRawData[row];
            while (targetRow.length <= col) {
                targetRow.push('');
            }
            targetRow[col] = value;

            targetSheet.rawData = newRawData;
            newXlsxData.sheets = [...newXlsxData.sheets];
            newXlsxData.sheets[sheetIndex] = targetSheet;

            // computedSheetData도 동일하게 업데이트 (수식 계산은 Handsontable에서 처리)
            const newComputedData = { ...state.computedSheetData };
            if (newComputedData[sheetIndex]) {
                const newSheetComputedData = (newComputedData[sheetIndex] || []).map(r => [...(r || [])]);
                 while (newSheetComputedData.length <= row) {
                    newSheetComputedData.push([]);
                }
                const targetComputedRow = newSheetComputedData[row];
                while(targetComputedRow.length <= col) {
                    targetComputedRow.push('');
                }
                targetComputedRow[col] = value;
                newComputedData[sheetIndex] = newSheetComputedData;
            }

            console.log(`[SpreadsheetSlice] Cell updated at sheet ${sheetIndex} [${row}, ${col}]. Setting saveStatus to 'modified'.`);

            return {
                ...state,
                xlsxData: newXlsxData,
                computedSheetData: newComputedData,
                activeSheetData: sheetIndex === state.xlsxData.activeSheetIndex ? targetSheet : state.activeSheetData,
                saveStatus: 'modified', // 변경사항이 있음을 표시
            };
        });
    },

    updateActiveSheetCell: (row, col, value) => {
        const { xlsxData, updateCellDataInSheet } = get();
        if (xlsxData) {
            updateCellDataInSheet(xlsxData.activeSheetIndex, row, col, value);
        }
    },

    setComputedDataForSheet: (sheetIndex, data) => {
        set((state) => ({
            ...state,
            computedSheetData: {
                ...state.computedSheetData,
                [sheetIndex]: data
            }
        }));
    },

    getComputedDataForSheet: (sheetIndex) => {
        const { computedSheetData } = get();
        return computedSheetData[sheetIndex] || null;
    },

    // === 시트 메타데이터 관리 ===
    setSheetMetaData: (metadata) => set({ sheetMetaData: metadata }),
    getSheetMetaData: () => get().sheetMetaData,
    markAsSaved: (sheetMetaDataId) => set((state) => ({
        ...state,
        sheetMetaData: state.sheetMetaData ? { 
            ...state.sheetMetaData, 
            isSaved: true,
            lastSaved: new Date()
        } : null
    })),
    markAsUnsaved: () => set((state) => ({
        ...state,
        sheetMetaData: state.sheetMetaData ? { 
            ...state.sheetMetaData, 
            isSaved: false 
        } : null
    })),

    // === 파일 업로드 관리 ===
    markFileAsUploaded: () => set({ hasUploadedFile: true }),
    canUploadFile: () => !get().hasUploadedFile,

    // === 유틸리티 ===
    cellAddressToCoords: (cellAddress) => cellAddressToCoords(cellAddress),

    coordsToSheetReference: (sheetIndex, row, col) => {
        const { xlsxData } = get();
        if (!xlsxData) return '';
        return coordsToSheetReference(sheetIndex, row, col, xlsxData.sheets.map(s => s.sheetName));
    },

    // === 시트 테이블 데이터 ID 관리 ===
    updateSheetTableDataIds: (sheetsInfo) => {
        set((state) => {
            if (!state.xlsxData) return state;

            const newXlsxData = { ...state.xlsxData };
            newXlsxData.sheets = [...newXlsxData.sheets];

            sheetsInfo.forEach((sheetInfo) => {
                const targetSheet = newXlsxData.sheets[sheetInfo.sheetIndex];
                if (targetSheet) {
                    newXlsxData.sheets[sheetInfo.sheetIndex] = {
                        ...targetSheet,
                        sheetTableDataId: sheetInfo.sheetTableDataId
                    };
                }
            });

            const activeSheetData = newXlsxData.sheets[newXlsxData.activeSheetIndex];

            return {
                ...state,
                xlsxData: newXlsxData,
                activeSheetData: activeSheetData
            };
        });
    },

    getSheetTableDataIdByIndex: (sheetIndex) => {
        const { xlsxData } = get();
        return xlsxData?.sheets[sheetIndex]?.sheetTableDataId || null;
    },

    updateSheetTableDataIdByIndex: (sheetIndex, sheetTableDataId) => {
        set((state) => {
            if (!state.xlsxData) return state;

            const newXlsxData = { ...state.xlsxData };
            newXlsxData.sheets = [...newXlsxData.sheets];

            const targetSheet = newXlsxData.sheets[sheetIndex];
            if (targetSheet) {
                newXlsxData.sheets[sheetIndex] = {
                    ...targetSheet,
                    sheetTableDataId: sheetTableDataId
                };

                const activeSheetData = sheetIndex === newXlsxData.activeSheetIndex 
                    ? newXlsxData.sheets[sheetIndex] 
                    : state.activeSheetData;

                return {
                    ...state,
                    xlsxData: newXlsxData,
                    activeSheetData: activeSheetData
                };
            }

            return state;
        });
    },

    // === GPT 분석용 데이터 ===
    getDataForGPTAnalysis: (sheetIndex, allSheets = false) => {
        const { xlsxData, computedSheetData, currentSheetMetaDataId } = get();

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
            const currentData = computedSheetData[sheetIdx] || sheet.rawData || [];

            const csv = currentData
                .map(row => {
                    if (!Array.isArray(row)) {
                        return ''; // 배열이 아닌 경우 빈 문자열 반환
                    }
                    return row.map(cell => String(cell || '')).join(',');
                })
                .join('\n');

            const fullData = currentData.map(row =>
                Array.isArray(row) ? row.map(cell => String(cell || '')) : []
            );

            const sampleData = currentData.slice(0, 5).map(row =>
                Array.isArray(row) ? row.map(cell => String(cell || '')) : []
            );

            sheets.push({
                name: sheet.sheetName,
                csv,
                metadata: {
                    rowCount: currentData.length,
                    columnCount: currentData[0]?.length || 0,
                    fullData: fullData,
                    sampleData: sampleData,
                    sheetIndex: sheetIdx,
                    originalMetadata: sheet.metadata
                }
            });
        }

        return {
            sheets,
            activeSheet: xlsxData.sheets[xlsxData.activeSheetIndex].sheetName,
            currentSheetIndex: xlsxData.activeSheetIndex,
            totalSheets: xlsxData.sheets.length,
            fileName: xlsxData.fileName,
            sheetMetaDataId: currentSheetMetaDataId || undefined
        };
    },

    // === 데이터 생성 결과 적용 ===
    applyGeneratedData: (generatedData: { 
        sheetName: string; 
        data: string[][]; 
        sheetIndex?: number 
    }) => {
        const { xlsxData } = get();
        const newRawData = generatedData.data;

        // 파일이 없는 경우 새 파일 생성
        if (!xlsxData) {
            const newXlsxData: XLSXData = {
                fileName: 'generated_data.xlsx',
                sheets: [{
                    sheetName: generatedData.sheetName || 'Sheet1',
                    rawData: newRawData,
                    metadata: {
                        rowCount: newRawData.length,
                        columnCount: newRawData[0]?.length || 0,
                        dataRange: {
                            startRow: 0,
                            endRow: newRawData.length -1,
                            startCol: 0,
                            endCol: (newRawData[0]?.length || 1) - 1,
                            startColLetter: 'A',
                            endColLetter: String.fromCharCode(65 + (newRawData[0]?.length || 1) - 1)
                        },
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
                    computedSheetData: { 0: [...newRawData] },
                    saveStatus: 'modified',
                };
            });

            return;
        }

        // 기존 파일에 데이터 업데이트 또는 새 시트 추가
        const sheetIndex = generatedData.sheetIndex !== undefined
            ? generatedData.sheetIndex
            : xlsxData.activeSheetIndex;

        if (sheetIndex < xlsxData.sheets.length) {
            // 기존 시트 업데이트
            const newXlsxData = { ...xlsxData };
            const targetSheet = { ...newXlsxData.sheets[sheetIndex] };

            targetSheet.rawData = newRawData;

            if (!targetSheet.metadata) {
                targetSheet.metadata = {
                    rowCount: newRawData.length,
                    columnCount: newRawData[0]?.length || 0,
                    dataRange: {
                        startRow: 0,
                        endRow: newRawData.length -1,
                        startCol: 0,
                        endCol: (newRawData[0]?.length || 1) - 1,
                        startColLetter: 'A',
                        endColLetter: String.fromCharCode(65 + (newRawData[0]?.length || 1) - 1)
                    },
                    preserveOriginalStructure: true,
                    lastModified: new Date()
                };
            } else {
                targetSheet.metadata = {
                    ...targetSheet.metadata,
                    rowCount: newRawData.length,
                    columnCount: newRawData[0]?.length || 0,
                    dataRange: {
                        ...targetSheet.metadata.dataRange,
                        startRow: 0,
                        endRow: newRawData.length -1,
                        startCol: 0,
                        endCol: (newRawData[0]?.length || 1) - 1,
                        endColLetter: String.fromCharCode(65 + (newRawData[0]?.length || 1) - 1)
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
                        [sheetIndex]: [...newRawData]
                    },
                    saveStatus: 'modified',
                };
            });
        } else {
            // 새 시트 추가
            const newSheet: SheetData = {
                sheetName: generatedData.sheetName || `Sheet${xlsxData.sheets.length + 1}`,
                rawData: newRawData,
                metadata: {
                    rowCount: newRawData.length,
                    columnCount: newRawData[0]?.length || 0,
                    dataRange: {
                        startRow: 0,
                        endRow: newRawData.length - 1,
                        startCol: 0,
                        endCol: (newRawData[0]?.length || 1) - 1,
                        startColLetter: 'A',
                        endColLetter: String.fromCharCode(65 + (newRawData[0]?.length || 1) - 1)
                    },
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
                        [xlsxData.sheets.length]: [...newRawData]
                    },
                    saveStatus: 'modified',
                };
            });
        }
    }
}); 