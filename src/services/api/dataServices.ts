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

// 데이터 생성 응답 인터페이스
export interface DataGenerationResponse {
    success: boolean;
    editedData?: {
        sheetName: string;
        data: string[][];   // 수정된 2차원 배열 데이터
        headers: string[];  // 헤더 (변경될 수 있음)
    };
    sheetIndex?: number;    // 수정된 시트 인덱스
    explanation?: string;   // 변경 설명
    changeLog?: any[];      // 변경 내역
    error?: string;
}

// 일반 채팅 응답 인터페이스
export interface NormalChatResponse {
    success: boolean;
    message: string;
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

// 데이터 생성 API 호출
export const callDataGenerationAPI = async (
    userInput: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any
): Promise<DataGenerationResponse> => {
    // 현재 데이터 컨텍스트 (있는 경우)
    let currentData = null;
    if (extendedSheetContext && getDataForGPTAnalysis) {
        currentData = getDataForGPTAnalysis(undefined, true);
    }

    const requestBody = {
        userInput,
        currentData,
        language: 'ko'
    };

    console.log('Data Generation Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/datagenerate/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    // 응답 상태 확인
    console.log('Response Status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Data Generation API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Data Generation API Response:', result);
    return result;
};

// 일반 채팅 API 호출
export const callNormalChatAPI = async (
    userInput: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any
): Promise<NormalChatResponse> => {
    // 현재 데이터 컨텍스트 (있는 경우)
    let currentData = null;
    if (extendedSheetContext && getDataForGPTAnalysis) {
        currentData = getDataForGPTAnalysis(undefined, true);
    }

    const requestBody = {
        userInput,
        currentData,
        language: 'ko'
    };

    console.log('Normal Chat Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/normal/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Normal Chat API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Normal Chat API Response:', result);
    return result;
}; 