import { useCallback } from 'react';
import useSpreadsheetNamesStore from '@/_store/sheet/spreadSheetNamesStore';

interface SheetInfo {
    name: string;
    index: number;
}

export const useSelectedSheetInfoStore = () => {
    const selectedSheets = useSpreadsheetNamesStore((s) => s.selectedSheets);
    const addSelectedSheet = useSpreadsheetNamesStore((s) => s.addSelectedSheet);
    const removeSelectedSheet = useSpreadsheetNamesStore((s) => s.removeSelectedSheet);
    const clearSelectedSheets = useSpreadsheetNamesStore((s) => s.clearSelectedSheets);
    const addAllSheets = useSpreadsheetNamesStore((s) => s.addAllSheets);

    // 시트가 선택되어 있는지 확인하는 헬퍼 함수
    const isSheetSelected = useCallback((sheetName: string): boolean => {
        return selectedSheets.some(sheet => sheet.name === sheetName);
    }, [selectedSheets]);

    // 시트 토글 함수 (선택되어 있으면 제거, 없으면 추가)
    const toggleSheetSelection = useCallback((sheetName: string, sheetIndex: number) => {
        if (isSheetSelected(sheetName)) {
            removeSelectedSheet(sheetName);
        } else {
            addSelectedSheet(sheetName, sheetIndex);
        }
    }, [isSheetSelected, addSelectedSheet, removeSelectedSheet]);

    // 선택된 시트 개수
    const selectedSheetCount = selectedSheets.length;

    // 특정 시트의 인덱스 가져오기
    const getSheetIndex = useCallback((sheetName: string): number | undefined => {
        const sheet = selectedSheets.find(sheet => sheet.name === sheetName);
        return sheet?.index;
    }, [selectedSheets]);

    return {
        // 상태
        selectedSheets,
        selectedSheetCount,
        
        // 액션들
        addSelectedSheet,
        removeSelectedSheet,
        clearSelectedSheets,
        addAllSheets,
        
        // 헬퍼 함수들
        isSheetSelected,
        toggleSheetSelection,
        getSheetIndex,
    };
};

export default useSelectedSheetInfoStore;
