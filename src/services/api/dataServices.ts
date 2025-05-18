// API 서비스 모듈
import { validateExtendedSheetContext } from '../../utils/chatUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 응답 인터페이스
export interface ArtifactResponse {
    success: boolean;
    code?: string;
    type?: 'chart' | 'table' | 'analysis';
    explanation?: {
        korean: string;
    };
    title?: string;
    error?: string;
    timestamp?: Date;
}

export interface FormulaResponse {
    success: boolean;
    formula?: string;
    explanation?: {
        korean: string;
    };
    cellAddress?: string;
    error?: string;
}

// 아티팩트 생성 API 호출
export const callArtifactAPI = async (
    userInput: string,
    extendedSheetContext: any,
    getDataForGPTAnalysis: (sheetIndex?: number, includeAllSheets?: boolean) => any
): Promise<ArtifactResponse> => {
    if (!extendedSheetContext) {
        throw new Error('시트 데이터가 없습니다.');
    }

    // 데이터 구조 검증
    try {
        validateExtendedSheetContext(extendedSheetContext);
    } catch (error) {
        console.error('ExtendedSheetContext 검증 실패:', error);
        throw error;
    }

    // 다중 시트 데이터 포함
    const analysisData = getDataForGPTAnalysis(undefined, true);

    // analysisData 구조도 확인
    console.log('Analysis Data:', {
        sheets: analysisData?.sheets?.length,
        activeSheet: analysisData?.activeSheet
    });

    const requestBody = {
        userInput,
        extendedSheetContext: extendedSheetContext,
        sheetsData: analysisData,
        language: 'ko'
    };

    console.log('Final Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/artifact/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    // 응답 상태 자세히 확인
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Artifact API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    return result;
};

// 포뮬러 생성 API 호출
export const callFormulaAPI = async (
    userInput: string,
    extendedSheetContext: any
): Promise<FormulaResponse> => {
    if (!extendedSheetContext) {
        throw new Error('시트 데이터가 없습니다.');
    }

    const requestBody = {
        userInput,
        sheetContext: extendedSheetContext,
        language: 'ko'
    };

    const response = await fetch(`${API_BASE_URL}/formula/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
    }

    return response.json();
}; 