export interface editScriptReqDto {
    message: string;

    workFlowId: string;

    workFlowCodeId: string;


    sourceSheetVersionId: string;

    targetSheetVersionId: string;
}

export interface editScriptResDto {
    success: boolean;
    workFlowCodeId: string;
    mappingSuggestions: string;
}