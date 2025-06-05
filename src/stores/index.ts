import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createSpreadsheetSlice, SpreadsheetSlice } from './slices/spreadsheetSlice';
import { createChatSlice, ChatSlice } from './slices/chatSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { parseXLSXFile, coordsToSheetReference, cellAddressToCoords } from './store-utils/xlsxUtils';
import { SheetData } from './store-types';

// 전체 스토어 타입 (resetAllStores 함수 포함)
type UnifiedStore = SpreadsheetSlice & ChatSlice & UISlice & {
    resetAllStores: () => void;
};

// 통합 스토어 생성
export const useUnifiedStore = create<UnifiedStore>()(
    devtools(
        (set, get, store) => ({
            ...createSpreadsheetSlice(set, get, store),
            ...createChatSlice(set, get, store),
            ...createUISlice(set, get, store),
            
            // resetAllStores 함수 추가
            resetAllStores: () => {
                console.log('🧹 모든 스토어 초기화 중...');
                const { resetUIStore } = get();
                resetUIStore();
                
                // 직접 상태 리셋
                set({
                    // 스프레드시트 리셋
                    xlsxData: null,
                    activeSheetData: null,
                    computedSheetData: {},
                    extendedSheetContext: null,
                    currentSpreadsheetId: null,
                    spreadsheetMetadata: null,
                    hasUploadedFile: false, // 파일 업로드 상태 초기화
                    
                    // 채팅 리셋 (세션과 히스토리는 유지)
                    sheetMessages: {},
                    activeSheetMessages: [],
                    sheetChatIds: {},
                });
                
                console.log('✅ 모든 스토어 초기화 완료 - 파일 업로드 가능');
            }
        }),
        {
            name: 'unified-store',
            skipHydration: true
        }
    )
);

// 편의 훅들
export const useActiveSheet = () => {
    const activeSheetData = useUnifiedStore(state => state.activeSheetData);
    const activeSheetIndex = useUnifiedStore(state => state.xlsxData?.activeSheetIndex);
    return { activeSheetData, activeSheetIndex };
};

export const useSheetList = () => {
    return useUnifiedStore(state =>
        state.xlsxData?.sheets.map((sheet: SheetData, index: number) => ({
            name: sheet.sheetName,
            index,
            isActive: index === state.xlsxData?.activeSheetIndex
        })) || []
    );
};

// 편의 함수로 resetAllStores export
export const resetAllStores = () => {
    useUnifiedStore.getState().resetAllStores();
};

// 유틸리티 함수들 export
export { parseXLSXFile, coordsToSheetReference, cellAddressToCoords };

// 타입들 export
export * from './store-types';
export type { SpreadsheetSlice, ChatSlice, UISlice, UnifiedStore }; 