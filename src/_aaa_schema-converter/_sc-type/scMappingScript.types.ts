export interface ScMappingScriptReqDto {
    userId: string | null; // 사용자 ID (필수)
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

// 매핑 아이템: source와 target의 row, col 정보를 담은 객체
export interface ScMappingItem {
    source_row: number;
    source_col: number;
    target_row: number;
    target_col: number;
}

// 매핑 스크립트: 소스/타겟 시트 이름과 매핑 배열
export interface ScMappingScript {
    source_sheet: string;
    target_sheet: string;
    mappings: ScMappingItem[];
}
