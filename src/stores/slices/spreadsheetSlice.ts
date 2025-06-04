import { StateCreator } from 'zustand';
import { XLSXData, SheetData, ExtendedSheetContext, SpreadsheetMetadata, LoadingStates, ErrorStates } from '../store-types';
import { generateExtendedSheetContext, coordsToSheetReference, cellAddressToCoords } from '../sotre-utils/xlsxUtils';

// 스프레드시트 슬라이스 상태
export interface SpreadsheetSlice {
    // === 데이터 상태 ===
    xlsxData: XLSXData | null;
    activeSheetData: SheetData | null;
    computedSheetData: { [sheetIndex: number]: string[][] };
    extendedSheetContext: ExtendedSheetContext | null;
    
    // === 스프레드시트 메타데이터 ===
    currentSpreadsheetId: string | null;
    spreadsheetMetadata: SpreadsheetMetadata | null;
    hasUploadedFile: boolean;
    
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
    
    // 스프레드시트 메타데이터 관리
    setCurrentSpreadsheetId: (spreadsheetId: string | null) => void;
    getCurrentSpreadsheetId: () => string | null;
    setSpreadsheetMetadata: (metadata: SpreadsheetMetadata | null) => void;
    getSpreadsheetMetadata: () => SpreadsheetMetadata | null;
    markAsSaved: (spreadsheetId: string) => void;
    markAsUnsaved: () => void;
    
    // 파일 업로드 관리
    markFileAsUploaded: () => void;
    canUploadFile: () => boolean;
    
    // 유틸리티
    updateExtendedSheetContext: () => void;
    cellAddressToCoords: (cellAddress: string) => { row: number; col: number };
    coordsToSheetReference: (sheetIndex: number, row: number, col: number) => string;
    
    // 시트 ID 관리
    updateSheetIds: (sheetsInfo: Array<{
        sheetId: string;
        sheetIndex: number;
        sheetName: string;
        headers: string[];
        rowCount: number;
    }>) => void;
    getSheetIdByIndex: (sheetIndex: number) => string | null;
    updateSheetIdByIndex: (sheetIndex: number, sheetId: string) => void;
    
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
        spreadsheetId?: string;
    };
    
    // 데이터 생성 결과 적용
    applyGeneratedData: (generatedData: { 
        sheetName: string; 
        headers: string[]; 
        data: string[][]; 
        sheetIndex?: number 
    }) => void;
}

// 스프레드시트 슬라이스 생성자
export const createSpreadsheetSlice: StateCreator<
    SpreadsheetSlice & { loadingStates: LoadingStates; errors: ErrorStates; setLoadingState: any; setError: any },
    [],
    [],
    SpreadsheetSlice
> = (set, get) => ({
    // === 초기 상태 ===
    xlsxData: null,
    activeSheetData: null,
    computedSheetData: {},
    extendedSheetContext: null,
    currentSpreadsheetId: null,
    spreadsheetMetadata: null,
    hasUploadedFile: false,
    
    // === XLSX 데이터 액션들 ===
    setXLSXData: (data) => {
        set((state) => {
            if (!data) {
                return {
                    ...state,
                    xlsxData: null,
                    activeSheetData: null,
                    computedSheetData: {},
                    extendedSheetContext: null
                };
            }

            const activeSheet = data.sheets[data.activeSheetIndex];
            const newComputedData = { ...state.computedSheetData };

            // 각 시트에 대한 computed data 초기화
            data.sheets.forEach((sheet, index) => {
                if (!newComputedData[index]) {
                    newComputedData[index] = [...(sheet.data || [])];
                }
            });

            // extendedSheetContext 생성
            let extendedSheetContext = null;
            try {
                extendedSheetContext = generateExtendedSheetContext(data, state.currentSpreadsheetId || data.spreadsheetId || undefined);
            } catch (error) {
                console.error('ExtendedSheetContext 생성 실패:', error);
                // 기본 헤더로 재시도
                try {
                    const fallbackData = {
                        ...data,
                        sheets: data.sheets.map(sheet => ({
                            ...sheet,
                            headers: sheet.headers && sheet.headers.length > 0 
                                ? sheet.headers 
                                : ['Column A', 'Column B', 'Column C', 'Column D', 'Column E', 'Column F']
                        }))
                    };
                    extendedSheetContext = generateExtendedSheetContext(fallbackData, state.currentSpreadsheetId || data.spreadsheetId || undefined);
                } catch (fallbackError) {
                    console.error('폴백 ExtendedSheetContext 생성도 실패:', fallbackError);
                }
            }

            return {
                ...state,
                xlsxData: data,
                hasUploadedFile: true,
                activeSheetData: activeSheet,
                computedSheetData: newComputedData,
                extendedSheetContext
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
                extendedSheetContext: generateExtendedSheetContext(newXlsxData, state.currentSpreadsheetId || undefined)
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
        return computedSheetData[activeIndex] || xlsxData.sheets[activeIndex]?.data || null;
    },

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
                extendedSheetContext: generateExtendedSheetContext(newXlsxData, state.currentSpreadsheetId || undefined)
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

    // === 스프레드시트 메타데이터 관리 ===
    setCurrentSpreadsheetId: (spreadsheetId) => set({ currentSpreadsheetId: spreadsheetId }),
    getCurrentSpreadsheetId: () => get().currentSpreadsheetId,
    setSpreadsheetMetadata: (metadata) => set({ spreadsheetMetadata: metadata }),
    getSpreadsheetMetadata: () => get().spreadsheetMetadata,
    markAsSaved: (spreadsheetId) => set((state) => ({
        ...state,
        currentSpreadsheetId: spreadsheetId,
        spreadsheetMetadata: state.spreadsheetMetadata ? { 
            ...state.spreadsheetMetadata, 
            isSaved: true,
            lastSaved: new Date()
        } : null
    })),
    markAsUnsaved: () => set((state) => ({
        ...state,
        spreadsheetMetadata: state.spreadsheetMetadata ? { 
            ...state.spreadsheetMetadata, 
            isSaved: false 
        } : null
    })),

    // === 파일 업로드 관리 ===
    markFileAsUploaded: () => set({ hasUploadedFile: true }),
    canUploadFile: () => !get().hasUploadedFile,

    // === 유틸리티 ===
    updateExtendedSheetContext: () => {
        const { xlsxData, currentSpreadsheetId } = get();
        if (xlsxData) {
            try {
                const newContext = generateExtendedSheetContext(xlsxData, currentSpreadsheetId || xlsxData.spreadsheetId || undefined);
                set({ extendedSheetContext: newContext });
            } catch (error) {
                console.error('ExtendedSheetContext 업데이트 실패:', error);
                try {
                    const fallbackData = {
                        ...xlsxData,
                        sheets: xlsxData.sheets.map(sheet => ({
                            ...sheet,
                            headers: sheet.headers && sheet.headers.length > 0 
                                ? sheet.headers 
                                : ['Column A', 'Column B', 'Column C', 'Column D', 'Column E', 'Column F']
                        }))
                    };
                    const fallbackContext = generateExtendedSheetContext(fallbackData, currentSpreadsheetId || xlsxData.spreadsheetId || undefined);
                    set({ extendedSheetContext: fallbackContext });
                } catch (fallbackError) {
                    console.error('폴백 ExtendedSheetContext 업데이트도 실패:', fallbackError);
                }
            }
        }
    },

    cellAddressToCoords: (cellAddress) => cellAddressToCoords(cellAddress),

    coordsToSheetReference: (sheetIndex, row, col) => {
        const { xlsxData } = get();
        if (!xlsxData) return '';
        return coordsToSheetReference(sheetIndex, row, col, xlsxData.sheets.map(s => s.sheetName));
    },

    // === 시트 ID 관리 ===
    updateSheetIds: (sheetsInfo) => {
        set((state) => {
            if (!state.xlsxData) return state;

            const newXlsxData = { ...state.xlsxData };
            newXlsxData.sheets = [...newXlsxData.sheets];

            sheetsInfo.forEach((sheetInfo) => {
                const targetSheet = newXlsxData.sheets[sheetInfo.sheetIndex];
                if (targetSheet) {
                    newXlsxData.sheets[sheetInfo.sheetIndex] = {
                        ...targetSheet,
                        sheetId: sheetInfo.sheetId
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

    getSheetIdByIndex: (sheetIndex) => {
        const { xlsxData } = get();
        return xlsxData?.sheets[sheetIndex]?.sheetId || null;
    },

    updateSheetIdByIndex: (sheetIndex, sheetId) => {
        set((state) => {
            if (!state.xlsxData) return state;

            const newXlsxData = { ...state.xlsxData };
            newXlsxData.sheets = [...newXlsxData.sheets];

            const targetSheet = newXlsxData.sheets[sheetIndex];
            if (targetSheet) {
                newXlsxData.sheets[sheetIndex] = {
                    ...targetSheet,
                    sheetId: sheetId
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
        const { xlsxData, computedSheetData, currentSpreadsheetId } = get();

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

            // 안전한 CSV 생성 - undefined나 배열이 아닌 경우 처리
            const safeHeaders = Array.isArray(sheet.headers) ? sheet.headers : [];
            const safeCurrentData = Array.isArray(currentData) ? currentData : [];
            
            const csv = [safeHeaders, ...safeCurrentData]
                .map(row => {
                    if (!Array.isArray(row)) {
                        return ''; // 배열이 아닌 경우 빈 문자열 반환
                    }
                    return row.map(cell => String(cell || '')).join(',');
                })
                .join('\n');

            const validHeaders = Array.isArray(sheet.headers)
                ? sheet.headers.map(h => String(h))
                : [];

            const fullData = safeCurrentData.map(row =>
                Array.isArray(row) ? row.map(cell => String(cell || '')) : []
            );

            const sampleData = safeCurrentData.slice(0, 5).map(row =>
                Array.isArray(row) ? row.map(cell => String(cell || '')) : []
            );

            sheets.push({
                name: sheet.sheetName,
                csv,
                metadata: {
                    headers: validHeaders,
                    rowCount: currentData.length,
                    columnCount: validHeaders.length,
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
            spreadsheetId: currentSpreadsheetId || undefined
        };
    },

    // === 데이터 생성 결과 적용 ===
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
                    extendedSheetContext: generateExtendedSheetContext(newXlsxData, state.currentSpreadsheetId || undefined)
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

            targetSheet.headers = generatedData.headers;
            targetSheet.data = generatedData.data;
            targetSheet.rawData = [generatedData.headers, ...generatedData.data];

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
                    extendedSheetContext: generateExtendedSheetContext(newXlsxData, state.currentSpreadsheetId || undefined)
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
                    extendedSheetContext: generateExtendedSheetContext(newXlsxData, state.currentSpreadsheetId || undefined)
                };
            });
        }
    }
}); 