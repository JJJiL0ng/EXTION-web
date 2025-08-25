import { create } from 'zustand';

interface SheetInfo {
    name: string;
    index: number;
}

interface SelectedSheetInfo {
    selectedSheets: SheetInfo[];
    addSelectedSheet: (sheetName: string, sheetIndex: number) => void;
    removeSelectedSheet: (sheetName: string) => void;
    clearSelectedSheets: () => void;
    addAllSheets: (sheets: SheetInfo[]) => void;
}

const useSelectedSheetInfo = create<SelectedSheetInfo>((set) => ({
    selectedSheets: [],
    addSelectedSheet: (sheetName, sheetIndex) => set((state) => {
        // 이미 선택된 시트인지 확인
        const isAlreadySelected = state.selectedSheets.some(sheet => sheet.name === sheetName);
        if (isAlreadySelected) {
            return state; // 이미 선택된 경우 상태 변경 없음
        }
        return {
            selectedSheets: [...state.selectedSheets, { name: sheetName, index: sheetIndex }]
        };
    }),
    removeSelectedSheet: (sheetName) => set((state) => ({
        selectedSheets: state.selectedSheets.filter(sheet => sheet.name !== sheetName)
    })),
    clearSelectedSheets: () => set({ selectedSheets: [] }),
    addAllSheets: (sheets) => set(() => ({
        selectedSheets: sheets
    })),
}));

export default useSelectedSheetInfo;