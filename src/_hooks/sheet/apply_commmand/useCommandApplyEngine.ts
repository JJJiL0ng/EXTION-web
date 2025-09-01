import { dataEditCommand } from "@/_Api/ai-chat/aiChatApi.types";
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";
import GC from '@mescius/spread-sheets';

interface CommandApplyEngineProps {
    dataEditCommand: dataEditCommand;
}

const useCommandApplyEngine = ({ dataEditCommand }: CommandApplyEngineProps) => {

    const { spread } = useSpreadsheetContext();
    const sheet = spread.getActiveSheet();

    const sheetIndex = dataEditCommand.sheetIndex;
    const detailedCommand = dataEditCommand.detailedCommand;
    const range = dataEditCommand.range;

    const commandType = dataEditCommand.commandType;

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

        // case "filter_data": {
        //     const filterRange = new GC.Spread.Sheets.Range(range[0], range[1], range[2], range[3]);
        //     const rowFilter = new GC.Spread.Sheets.Filter.HideRowFilter(filterRange);
        //     sheet.rowFilter(rowFilter);
        //     break;
        // }

        case "apply_style": {
            const style = new GC.Spread.Sheets.Style();
            
            
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

export default useCommandApplyEngine;

