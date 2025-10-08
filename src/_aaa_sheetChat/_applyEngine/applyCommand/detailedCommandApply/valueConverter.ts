import { dataEditCommand } from "@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/dataEdit.types";
import { Spread } from "@mescius/spread-sheets";

interface ValueConverterEngineProsp {
    spread: any;
    dataEditCommand: dataEditCommand;
}

export const valueConverterEngine = ({ spread, dataEditCommand }: ValueConverterEngineProsp) => {
    // detailedCommand 파싱 로직
    if (typeof dataEditCommand.detailedCommand !== 'string') {
        throw new Error('dataEditCommand must be a string in format: findText/replaceText');
    }
    const commandParts = dataEditCommand.detailedCommand.split('/');
    if (commandParts.length !== 2) {
        throw new Error('Invalid detailedCommand format. Expected: findText/replaceText');
    }
    const [findText, replaceText] = commandParts;

    const targetSheet = spread.getSheetFromName(dataEditCommand.sheetName);

    // range 구조: [startRow, startCol, endRow, endCol]
    const [startRow, startCol, endRow, endCol] = dataEditCommand.range;

    targetSheet.suspendPaint();

    // 시작 행부터 끝 행까지 반복
    for (let row = startRow; row <= endRow; row++) {
        // 시작 열부터 끝 열까지 반복
        for (let col = startCol; col <= endCol; col++) {
            const cellValue = targetSheet.getValue(row, col);

            if (cellValue && typeof cellValue === 'string') {
                if (cellValue === findText) {
                    targetSheet.setValue(row, col, replaceText);
                }

                if (cellValue.indexOf(findText) !== -1) {
                    const newValue = cellValue.replace(new RegExp(findText, 'g'), replaceText);
                    targetSheet.setValue(row, col, newValue);
                }
            }
        }
    }

    targetSheet.resumePaint();
}