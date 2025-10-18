export interface ScMappingScriptReqDto {
    sourceSheetVersionId: string;
    targetSheetVersionId: string;
    workFlowCodeId: string;
    modelType?: 'small' | 'normal' | 'large'; // AI 모델 선택 (기본값: 'small')
}

export interface ScMappingScriptResDto {
    success: boolean;
    workFlowCodeId: string;
    mappingScript: ScMappingScript; // 생성된 매핑 스크립트
}

export interface ScMappingItem {
    source_row: number;
    source_col: number;
    target_row: number;
    target_col: number;
}

export interface ScMappingScript {
    source_sheet: string;
    target_sheet: string;
    mappings: ScMappingItem[];
}
