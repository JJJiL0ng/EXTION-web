import { dataEditCommand } from "@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/dataEdit.types";
import { StyleCommand } from "@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/style.types";
import styleCommandApplyEngine from "./styleCommandApplyEngine";
import addNewSheet from "./detailedCommandApply/addNewSheet";
import { valueConverterEngine } from "./detailedCommandApply/valueConverter";

interface CommandApplyEngineProps {
    dataEditCommand: dataEditCommand;
    spread: any;
}

const commandApplyEngine = ({ dataEditCommand, spread }: CommandApplyEngineProps) => {

    console.log('🚀 [commandApplyEngine] Full dataEditCommand:', dataEditCommand);
    console.log('🚀 [commandApplyEngine] detailedCommand:', dataEditCommand.detailedCommand);
    console.log('🚀 [commandApplyEngine] commandType:', dataEditCommand.commandType);

    const sheet = spread.getActiveSheet();
    const sheetName = dataEditCommand.sheetName;
    const detailedCommand = dataEditCommand.detailedCommand as any;
    const range = dataEditCommand.range as unknown as number[]; // 항상 숫자 배열로 전달됨 (caller 보장)
    spread.options.allowDynamicArray = true; // 동적 배열 허용


    // 런타임 안전 체크: 배열이 아니거나 길이가 2 또는 4가 아니면 중단
    if (!Array.isArray(range) || (range.length !== 2 && range.length !== 4)) {
        console.error("[commandApplyEngine] Invalid range. Expected number[] of length 2 or 4, got:", range);
        return;
    }

    const commandType = dataEditCommand.commandType;

    console.log('🚀 [commandApplyEngine] Processed range:', range, 'type:', typeof range, 'length:', range.length);
    console.log('🚀 [commandApplyEngine] Range values:', range[0], range[1], range[2], range[3]);

    const { executeStyleCommand } = styleCommandApplyEngine({
        sheetName,
        range,
        styleCommand: detailedCommand as StyleCommand,
        spread
    });

    switch (commandType) {
        case "value_change": {
            const targetSheet = spread.getSheetFromName(sheetName)
            if (range.length === 2) {
                // 단일 셀 값 변경
                targetSheet.setValue(range[0], range[1], detailedCommand);
            } else {
                // 범위 값 변경: [row, col, rowCount, colCount]
                const [row, col, rowCount, colCount] = range;

                // detailedCommand가 2차원 배열이면 setArray 사용
                const is2DArray = Array.isArray(detailedCommand) &&
                    detailedCommand.every((r: any) => Array.isArray(r));

                if (is2DArray) {
                    try {
                        targetSheet.setArray(row, col, detailedCommand);
                    } catch (e) {
                        console.warn("[commandApplyEngine] setArray failed, fallback to fill loop:", e);
                        for (let r = 0; r < rowCount; r++) {
                            for (let c = 0; c < colCount; c++) {
                                const v = (detailedCommand[r] && detailedCommand[r][c] !== undefined)
                                    ? detailedCommand[r][c]
                                    : null;
                                targetSheet.setValue(row + r, col + c, v);
                            }
                        }
                    }
                } else {
                    // 스칼라 값이면 범위 전체에 채우기
                    for (let r = 0; r < rowCount; r++) {
                        for (let c = 0; c < colCount; c++) {
                            targetSheet.setValue(row + r, col + c, detailedCommand);
                        }
                    }
                }
            }
            break;
        }
        case "value_converter": {
            valueConverterEngine({ spread, dataEditCommand });
            break;
        }

        case "use_formula": {
            const targetSheet = spread.getSheetFromName(sheetName);
            console.log('🚀 [commandApplyEngine] Formula:', detailedCommand);
            console.log('🚀 [commandApplyEngine] Position: row:', range[0], 'col:', range[1]);

            if (range.length == 4) {
                console.log('🚀 [commandApplyEngine] Using setArrayFormula with range:', range);
                targetSheet.setArrayFormula(range[0], range[1], range[2], range[3], detailedCommand);
            }
            else if (range.length == 2) {
                console.log('🚀 [commandApplyEngine] Using setFormula at position:', range[0], range[1]);
                targetSheet.setFormula(range[0], range[1], detailedCommand);
            }
            console.log('🚀 [commandApplyEngine] Formula execution completed');
            break;
        }

        case "sort_data": {
            const { uniqueSheetName } = addNewSheet({ sheetName, spread, range }); // 시트 추가, 고유 이름 반환
            const targetSheet = spread.getSheetFromName(uniqueSheetName); // 새로 추가된 시트 가져오기
            targetSheet.setFormula(0, 0, detailedCommand); // 정렬 명령어 적용(새로운 시트를 만들고 그위에 수식을 적용시키므로 적용 타겟 셀은 (0,0)임)
            break;
        }

        case "filter_data": {
            const { uniqueSheetName } = addNewSheet({ sheetName, spread, range }); // 시트 추가, 고유 이름 반환
            const targetSheet = spread.getSheetFromName(uniqueSheetName); // 새로 추가된 시트 가져오기
            targetSheet.setFormula(0, 0, detailedCommand); // 필터 명령어 적용(새로운 시트를 만들고 그위에 수식을 적용시키므로 적용 타겟 셀은 (0,0)임)
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

