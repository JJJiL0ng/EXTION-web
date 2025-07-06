import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createSpreadsheetSlice, SpreadsheetSlice } from './slices/spreadsheetSlice';
import { createChatSlice, ChatSlice } from './slices/chatSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { LoadingStates, ErrorStates } from './store-types';

// 개별 스프레드시트 스토어
export const useSpreadsheetStore = create<
    SpreadsheetSlice & { 
        loadingStates: LoadingStates; 
        errors: ErrorStates; 
        setLoadingState: any; 
        setError: any; 
        currentSheetMetaDataId: string | null;
    }
>()(
    devtools(
        (set, get, store) => {
            // 기본 UI 상태 제공
            const mockUIState = {
                loadingStates: {
                    fileUpload: false,
                    sheetSwitch: false,
                    formulaGeneration: false,
                    artifactGeneration: false,
                    dataGeneration: false,
                    dataFix: false,
                },
                errors: {
                    fileError: null,
                    sheetError: null,
                    formulaError: null,
                    artifactError: null,
                    dataGenerationError: null,
                    dataFixError: null,
                },
                currentSheetMetaDataId: null,
                setLoadingState: (type: keyof LoadingStates, loading: boolean) =>
                    set((state) => ({
                        loadingStates: { ...state.loadingStates, [type]: loading }
                    }), false, `setLoadingState/${type}`),
                setError: (type: keyof ErrorStates, error: string | null) =>
                    set((state) => ({
                        errors: { ...state.errors, [type]: error }
                    }), false, `setError/${type}`),
            };

            return {
                ...mockUIState,
                ...createSpreadsheetSlice(set, get, store),
            };
        },
        {
            name: 'spreadsheet-store',
            enabled: process.env.NODE_ENV === 'development',
            trace: true,
        }
    )
);

// 개별 채팅 스토어
export const useChatStore = create<ChatSlice & { xlsxData: any }>()(
    devtools(
        (set, get, store) => ({
            xlsxData: null, // 스프레드시트 데이터 참조용
            ...createChatSlice(set, get, store),
        }),
        {
            name: 'chat-store',
            enabled: process.env.NODE_ENV === 'development',
            trace: true,
        }
    )
);

// 개별 UI 스토어
export const useUIStore = create<
    UISlice & { 
        sheetMessages: { [sheetIndex: number]: any[] }; 
        xlsxData: any; 
        computedSheetData: any; 
        cellAddressToCoords: any;
    }
>()(
    devtools(
        (set, get, store) => {
            // UI 슬라이스에 필요한 기본 상태 제공
            const mockDependencies = {
                sheetMessages: {},
                xlsxData: null,
                computedSheetData: {},
                cellAddressToCoords: (cellAddress: string) => {
                    const match = cellAddress.match(/([A-Z]+)(\d+)/);
                    if (!match) return { row: 0, col: 0 };
                    
                    const colStr = match[1];
                    const rowStr = match[2];
                    
                    let col = 0;
                    for (let i = 0; i < colStr.length; i++) {
                        col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
                    }
                    col -= 1; // 0-based index
                    
                    const row = parseInt(rowStr) - 1; // 0-based index
                    
                    return { row, col };
                },
            };

            return {
                ...mockDependencies,
                ...createUISlice(set, get, store),
            };
        },
        {
            name: 'ui-store',
            enabled: process.env.NODE_ENV === 'development',
            trace: true,
        }
    )
);

// 개별 스토어 사용 예제
/*
// 사용법:
import { useSpreadsheetStore, useChatStore, useUIStore } from './stores/individual-stores';

// 컴포넌트에서 사용
const MyComponent = () => {
    const { xlsxData, setXLSXData } = useSpreadsheetStore();
    const { currentChatId, setCurrentChatId } = useChatStore();
    const { loadingStates, setLoadingState } = useUIStore();
    
    // ...
};
*/ 