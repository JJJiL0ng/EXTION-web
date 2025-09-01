import { dataEditCommand } from "@/_Api/ai-chat/aiChatApi.types";
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";

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
                sheet.setValue(range[0], range[1], range[2], range[3], detailedCommand);
            }
            else if (range.length == 2) {
                sheet.setValue(range[0], range[1], detailedCommand);
            }
            break;
        }

        case "use_formula": {
            // TODO: implement use formula command
            break;
        }

        case "control_sheet": {
            // TODO: implement control sheet command
            break;
        }

        case "sort_data": {
            // TODO: implement sort data command
            break;
        }

        case "apply_style": {
            // TODO: implement apply style command
            break;
        }

        case "filter_data": {
            // TODO: implement filter data command
            break;
        }

        case "summary_edit_history": {
            // TODO: implement summary edit history command
            break;
        }

        default: {
            // unknown command type
            break;
        }
    }
};

export default useCommandApplyEngine;

