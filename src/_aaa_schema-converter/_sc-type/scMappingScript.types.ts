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

// 매핑 아이템: [source_row, source_col, target_row, target_col] 배열 형식
export type ScMappingItem = [number, number, number, number];

export interface ScMappingScript {
    s: string; // source_sheet (축약형)
    t: string; // target_sheet (축약형)
    m: ScMappingItem[]; // mappings (축약형)
}
