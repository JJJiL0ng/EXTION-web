import { dataEditCommand } from "@/_types/ai-chat-api/dataEdit.types";
import { StyleCommand } from "@/_types/ai-chat-api/style.types";
import styleCommandApplyEngine from "./styleCommandApplyEngine";
import GC from '@mescius/spread-sheets';
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";


interface CommandApplyEngineProps {
    dataEditCommand: dataEditCommand;
    spread: any;
}

const commandApplyEngine = ({ dataEditCommand, spread }: CommandApplyEngineProps) => {

    console.log('🚀 [commandApplyEngine] Executing command:', dataEditCommand.detailedCommand);

    const sheet = spread.getActiveSheet();
    const sheetName = sheet.getActiveSheetName();
    console.log('🚀 [commandApplyEngine] Active sheet:', sheetName);

    const sheetIndex = dataEditCommand.sheetIndex;
    const detailedCommand = dataEditCommand.detailedCommand;
    const range = dataEditCommand.range;

    const commandType = dataEditCommand.commandType;

    const { executeStyleCommand } = styleCommandApplyEngine({
        sheetIndex,
        range,
        styleCommand: detailedCommand as StyleCommand,
        spread
    });

    switch (commandType) {
        case "value_change": {
            if (range.length == 4) {
                sheet.getSheet(sheetIndex); // 적용할시트 가져오기
                sheet.setValue(range[0], range[1], range[2], range[3], detailedCommand);
            }
            else if (range.length == 2) {
                sheet.getSheet(sheetIndex);
                sheet.setValue(range[0], range[1], detailedCommand);
            }
            break;
        }

        case "use_formula": {
            if (range.length == 4) {
                sheet.getSheet(sheetIndex);
                sheet.setArrayFormula(range[0], range[1], range[2], range[3], detailedCommand);
            }
            else if (range.length == 2) {
                sheet.getSheet(sheetIndex);
                sheet.setFormula(range[0], range[1], detailedCommand);
            } break;
        }

        case "sort_data": {
            sheet.getSheet(sheetIndex);
            sheet.setFormula(range[0], range[1], detailedCommand);
            break;
        }

        case "apply_style": {
            executeStyleCommand();
            break;
        }

        case "control_sheet": {
            // TODO: implement control sheet command
            break;
        }

        default: {
            // unknown command type
            break;
        }
    }
};

export default commandApplyEngine;

