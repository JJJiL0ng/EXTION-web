import GC from '@mescius/spread-sheets';
import createUniqueSheetName from './createUniqueSheetName';

interface AddNewSheetProps {
    sheetName: string;
    spread: any;
    range?: number[]; // [rowCount, colCount]
}

interface AddNewSheetReturn {
    uniqueSheetName: string;
}

const addNewSheet = ({ sheetName, spread, range }: AddNewSheetProps): AddNewSheetReturn => {
    let uniqueSheetName = '';

    if (!sheetName || sheetName.trim() === "") {
        uniqueSheetName = 'Extion Sheet';
    } else {
        uniqueSheetName = createUniqueSheetName(sheetName, spread);
    }

    // 1. 새 워크시트 인스턴스를 생성합니다.
    const newSheet = new GC.Spread.Sheets.Worksheet(uniqueSheetName);

    // 2. range 파라미터가 유효한 경우, 시트의 크기를 설정합니다.
    //    range는 [행, 열] 순서의 배열이어야 합니다.
    if (range && Array.isArray(range) && range.length >= 2) {
        newSheet.setRowCount(range[0]+10);    // 첫 번째 값을 행(row) + 여유분 10으로 설정
        newSheet.setColumnCount(range[1]+10); // 두 번째 값을 열(column) + 여유분 10으로 설정
    }

    // 3. 설정이 완료된 시트를 워크북에 추가합니다.
    spread.addSheet(spread.getSheetCount(), newSheet);
    spread.setActiveSheetIndex(spread.getSheetCount() - 1);
    spread.resumePaint();

    console.log(`New sheet '${uniqueSheetName}' added.`);
    return { uniqueSheetName };
}

export default addNewSheet;