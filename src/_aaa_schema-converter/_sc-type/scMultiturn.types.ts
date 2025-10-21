export interface editScriptReqDto {
    userId: string | null;

    message: string;

    workFlowId: string;

    workFlowCodeId: string;


    sourceSheetVersionId: string;

    targetSheetVersionId: string;
}

export interface editScriptResDto {
    success: boolean;
    workFlowCodeId: string;
    mappingSuggestion: string; // 서버에서 단수형으로 반환
}