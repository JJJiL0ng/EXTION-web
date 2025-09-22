import { StyleCommand } from "./style.types";

export interface dataEditChatRes {
    dataEditCommands: dataEditCommand[];
}

export interface dataEditCommand {
    sheetName: string; // 적용시킬 시트의 이름
    commandType: dataEditCommandType; // 예시: 'setformula'
    range: number[]; // 범위, 숫자배열. 예시 [0,6], [0,24,22,42]
    detailedCommand: string | StyleCommand; // 세부 명령어. 예시: '=SUM(B1:B10)'
    dataEditCommands?: dataEditCommand[]; // 중복 래핑된 구조 처리용
}

export enum dataEditCommandType {
    VALUE_CHANGE = 'value_change',
    USE_FORMULA = 'use_formula',
    CONTROL_SHEET = 'control_sheet',
    SORT_DATA = 'sort_data',
    APPLY_STYLE = 'apply_style',
    SUMMARY_EDIT_HISTORY = 'summary_edit_history',
    FIlTer_DATA = 'filter_data',
}
