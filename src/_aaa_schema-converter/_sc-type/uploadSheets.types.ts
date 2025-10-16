
export interface UploadSheetsReqDto {
    userId: string; // 사용자 ID (필수)
    
    sourceSheetData: Record<string, any>;

    targetSheetData: Record<string, any>;

    sourceSheetName: string; // "소스 v1", "2025-01-15 업로드" 등

    targetSheetName: string; // "타겟 v1" 등


    isFirstWorkFlowGenerated: boolean; // 처음 워크플로우 생성 여부


    isExcuteMappingSuggestion?: boolean; // 매핑 제안 실행 여부 (기본값: true)


    sourceSheetRange?: number[]; // [시작행, 종료행] - 선택사항

    selectedSourceSheetName?: string; // 선택된 시트 이름 - 선택사항


    targetSheetRange?: number[]; // [시작행, 종료행] - 선택사항


    selectedTargetSheetName?: string; // 선택된 시트 이름 - 선택사항

    workFlowId?: string; // 기존 워크플로우 ID
}

export interface UploadSheetsResDto {
    success: boolean;
    workflowId: string;
    sourceSheetVersionId: string;
    targetSheetVersionId: string;
    mappingSuggestions?: string; // 매핑 제안 결과 (선택적)
}
