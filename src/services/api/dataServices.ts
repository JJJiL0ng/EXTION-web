// API 서비스 모듈 - Firebase 연동 버전
import { validateExtendedSheetContext } from '../../utils/chatUtils';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// === Firebase 관련 인터페이스 추가 ===
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// === 응답 인터페이스 수정 ===
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
    // Firebase 관련 필드 추가
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
}

export interface FormulaResponse {
    success: boolean;
    formula?: string;
    explanation?: {
        korean: string;
    };
    cellAddress?: string;
    error?: string;
    // Firebase 관련 필드 추가
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
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
    // Firebase 관련 필드 추가
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
    spreadsheetMetadata?: {
        hasSpreadsheet: boolean;
        fileName?: string;
        totalSheets: number;
        activeSheetIndex: number;
        sheetNames: string[];
        lastModifiedAt: Date;
    };
}

// 데이터 수정 응답 인터페이스
export interface DataFixResponse {
    success: boolean;
    editedData?: {
        sheetName: string;
        data: string[][];   // 수정된 2차원 배열 데이터
        headers: string[];  // 헤더 (변경될 수 있음)
    };
    sheetIndex?: number;    // 수정된 시트 인덱스
    explanation?: string;   // 변경 설명
    changes?: {             // 변경 내역 상세 설명
        type: 'sort' | 'filter' | 'modify' | 'transform';
        details: string;
    };
    error?: string;
    // Firebase 관련 필드 추가
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
    spreadsheetMetadata?: {
        hasSpreadsheet: boolean;
        fileName?: string;
        totalSheets: number;
        activeSheetIndex: number;
        sheetNames: string[];
        lastModifiedAt: Date;
    };
}

// 일반 채팅 응답 인터페이스 - Firebase 필드 추가
export interface NormalChatResponse {
    success: boolean;
    message: string;
    error?: string;
    // === Firebase 관련 필드 추가 ===
    chatId?: string;
    messageId?: string; // 저장된 메시지 ID
    userMessageId?: string;
    aiMessageId?: string;
    timestamp?: string; // 백엔드 DTO는 string 타입
    spreadsheetMetadata?: { // 백엔드 컨트롤러 로깅 기준 필드
        // hasSpreadsheet?: boolean; // 백엔드 DTO에 명시적이지 않음
        fileName?: string;
        totalSheets?: number;
        activeSheetIndex?: number;
        sheetNames?: string[];
        // lastModifiedAt?: Date; // 백엔드 DTO에 명시적이지 않음
    };
}

// === Firebase 사용자 정보 가져오기 유틸리티 ===
export const getCurrentUser = (): FirebaseUser | null => {
    // Firebase Auth에서 현재 사용자 정보 가져오기
    // 이 부분은 Firebase Auth 설정에 따라 달라질 수 있음
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('firebase_user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

// === 채팅 제목 자동 생성 유틸리티 ===
const generateChatTitle = (userInput: string): string => {
    const title = userInput.length > 30 ? userInput.substring(0, 30) + '...' : userInput;
    return title || '새로운 채팅';
};

// === 공통 요청 본문 생성 함수 ===
const createRequestBody = (
    userInput: string,
    extendedSheetContext: any | null, // 실제 ExtendedSheetContext 타입 사용 권장
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any, // 실제 SheetsData 타입 반환 권장
    chatId?: string,
    chatTitle?: string, // 새 채팅 제목 (옵셔널)
    messageId?: string,  // 프론트 생성 임시 ID (옵셔널)
    currentSheetIndex?: number // 현재 시트 인덱스 추가
) => {
    const { user: currentUser, loading: authLoading } = useAuthStore.getState();
    
    if (authLoading) {
        // 인증 상태 로딩 중일 때는 API 호출을 시도하지 않도록 하거나,
        // 혹은 로딩이 완료될 때까지 기다리는 로직을 호출하는 쪽에서 처리해야 함을 명시
        console.warn('Auth state is still loading. API call might fail if user is not yet available.');
        // 경우에 따라 여기서 에러를 던지거나, 특정 응답을 반환할 수 있습니다.
        // throw new Error('인증 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }

    if (!currentUser) {
        throw new Error('로그인이 필요합니다. (currentUser is null in createRequestBody)');
    }

    // 현재 시트 데이터만 가져오기 (allSheets=false가 기본값)
    let analysisData = null;
    if (getDataForGPTAnalysis) {
        // currentSheetIndex가 제공되면 해당 시트, 아니면 현재 활성 시트만 전송
        analysisData = getDataForGPTAnalysis(currentSheetIndex, false); // false로 현재 시트만
    }

    return {
        // === Firebase 필수 필드 ===
        userId: currentUser.uid, // DTO: userId (string, UUID)
        
        // === 기존 필드 ===
        userInput, // DTO: userInput (string)
        
        // === 옵셔널 Firebase 필드 ===
        chatId: chatId || undefined, // DTO: chatId? (string, UUID)
        // 백엔드에서 chatId가 없고 chatTitle도 없으면 userInput 기반으로 생성하므로,
        // 프론트에서 명시적으로 chatTitle을 보내거나, undefined로 보냄
        chatTitle: chatTitle || undefined, // DTO: chatTitle? (string)
        messageId: messageId || undefined, // DTO: messageId? (string)
        
        // === 스프레드시트 관련 필드 ===
        // DTO: extendedSheetContext? (ExtendedSheetContext)
        // extendedSheetContext는 null 또는 객체로 전달
        extendedSheetContext: extendedSheetContext,
        
        // DTO: sheetsData? (SheetsData)
        // DTO: currentData? (SheetsData) - currentData는 legacy, sheetsData와 동일하게 전달
        // analysisData가 null일 경우, 해당 필드들은 null로 전달됨. 백엔드 DTO는 optional이므로 문제 없음.
        sheetsData: analysisData, 
        currentData: analysisData, 
        
        language: 'ko' // DTO: language? (string, default 'ko')
    };
};

// === 일반 채팅 API 호출 - Firebase 연동 버전 ===
export const callNormalChatAPI = async (
    userInput: string,
    extendedSheetContext: any | null, // 실제 ExtendedSheetContext 타입 사용 권장
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any, // 실제 SheetsData 타입 반환 권장
    options?: {
        chatId?: string;
        chatTitle?: string; // chatTitle을 options로 받을 수 있도록 추가
        messageId?: string;
        currentSheetIndex?: number; // 현재 시트 인덱스 추가
    }
): Promise<NormalChatResponse> => {
    try {
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            getDataForGPTAnalysis,
            options?.chatId,
            options?.chatTitle, // chatTitle 전달
            options?.messageId,
            options?.currentSheetIndex // 현재 시트 인덱스 전달
        );

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
            let errorMessage = `API 오류: ${response.status} - ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                // 백엔드에서 message 필드에 배열 또는 문자열로 에러 메시지를 줄 수 있음
                if (errorJson.message) {
                    errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
                } else if (errorText) {
                    errorMessage = errorText;
                }
            } catch (e) {
                // errorText가 JSON이 아닌 경우 그대로 사용
                if (errorText) errorMessage = errorText;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json() as NormalChatResponse; // 타입 단언
        console.log('Normal Chat API Response:', result);
        return result;
        
    } catch (error) {
        console.error('Normal Chat API Call Error:', error);
        throw error; // 이미 Error 객체이므로 그대로 throw
    }
};

// === 아티팩트 생성 API 호출 - Firebase 연동 버전 ===
export const callArtifactAPI = async (
    userInput: string,
    extendedSheetContext: any,
    getDataForGPTAnalysis: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number; // 현재 시트 인덱스 추가
    }
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

    try {
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            getDataForGPTAnalysis,
            options?.chatId,
            undefined, // 아티팩트는 새 채팅 생성하지 않음
            options?.messageId,
            options?.currentSheetIndex // 현재 시트 인덱스 전달
        );

        console.log('Artifact Request Body:', JSON.stringify(requestBody, null, 2));

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
        console.log('Artifact API Response:', result);
        return result;
        
    } catch (error) {
        console.error('Artifact API Call Error:', error);
        throw error;
    }
};

// === 포뮬러 생성 API 호출 - Firebase 연동 버전 ===
export const callFormulaAPI = async (
    userInput: string,
    extendedSheetContext: any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number; // 현재 시트 인덱스 추가
    }
): Promise<FormulaResponse> => {
    if (!extendedSheetContext) {
        throw new Error('시트 데이터가 없습니다.');
    }

    try {
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            undefined,
            options?.chatId,
            undefined,
            options?.messageId,
            options?.currentSheetIndex // 현재 시트 인덱스 전달
        );

        const response = await fetch(`${API_BASE_URL}/formula/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Formula API Call Error:', error);
        throw error;
    }
};

// === 데이터 수정 API 호출 - Firebase 연동 버전 ===
export const callDataFixAPI = async (
    userInput: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number; // 현재 시트 인덱스 추가
    }
): Promise<DataFixResponse> => {
    try {
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            getDataForGPTAnalysis,
            options?.chatId,
            undefined,
            options?.messageId,
            options?.currentSheetIndex // 현재 시트 인덱스 전달
        );

        console.log('Data Fix Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE_URL}/datafix/process`, {
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
            console.error('Data Fix API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Data Fix API Response:', result);
        return result;
        
    } catch (error) {
        console.error('Data Fix API Call Error:', error);
        throw error;
    }
};

// === 데이터 생성 API 호출 - Firebase 연동 버전 ===
export const callDataGenerationAPI = async (
    userInput: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number; // 현재 시트 인덱스 추가
    }
): Promise<DataGenerationResponse> => {
    try {
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            getDataForGPTAnalysis,
            options?.chatId,
            undefined,
            options?.messageId,
            options?.currentSheetIndex // 현재 시트 인덱스 전달
        );

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
        
    } catch (error) {
        console.error('Data Generation API Call Error:', error);
        throw error;
    }
};

// === 추가 채팅 관련 API 함수들 ===

// 사용자의 채팅 목록 조회
export const getUserChats = async (limit?: number): Promise<any[]> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/chats/user/${currentUser.uid}?limit=${limit || 50}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`채팅 목록 조회 실패: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Get User Chats Error:', error);
        throw error;
    }
};

// 특정 채팅의 메시지 조회
export const getChatMessages = async (chatId: string, limit?: number): Promise<any[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages?limit=${limit || 50}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`채팅 메시지 조회 실패: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Get Chat Messages Error:', error);
        throw error;
    }
};

// 새 채팅 생성
export const createNewChat = async (title: string, description?: string): Promise<{ chatId: string; success: boolean }> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/chats/${currentUser.uid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
            throw new Error(`채팅 생성 실패: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Create Chat Error:', error);
        throw error;
    }
};

// 채팅 접근 권한 검증
export const validateChatAccess = async (chatId: string): Promise<{ valid: boolean; chatTitle?: string; lastActivity?: string }> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return { valid: false };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/normal/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentUser.uid,
                chatId: chatId,
            }),
        });

        if (!response.ok) {
            return { valid: false };
        }

        return await response.json();
    } catch (error) {
        console.error('Validate Chat Access Error:', error);
        return { valid: false };
    }  
};
// === 스프레드시트 저장 API 호출 - Firebase 연동 버전 ===
export const saveSpreadsheetToFirebase = async (
    parsedData: {
        fileName: string;
        sheets: any[];
        activeSheetIndex?: number;
    },
    fileInfo: {
        originalFileName: string;
        fileSize: number;
        fileType: 'xlsx' | 'csv';
    },
    options?: {
        chatId?: string;
        userId?: string;
    }
): Promise<{
    success: boolean;
    spreadsheetId: string;
    chatId: string;
    fileName: string;
    sheets: Array<{
        sheetIndex: number;
        sheetName: string;
        headers: string[];
        rowCount: number;
    }>;
    error?: string;
}> => {
    try {
        const { user: currentUser } = useAuthStore.getState();
        
        if (!currentUser) {
            throw new Error('로그인이 필요합니다.');
        }

        const requestBody = {
            userId: options?.userId || currentUser.uid,
            chatId: options?.chatId,
            fileName: parsedData.fileName,
            originalFileName: fileInfo.originalFileName,
            fileSize: fileInfo.fileSize,
            fileType: fileInfo.fileType,
            activeSheetIndex: parsedData.activeSheetIndex || 0,
            sheets: parsedData.sheets.map((sheet: any, index: number) => ({
                sheetName: sheet.sheetName,
                sheetIndex: sheet.sheetIndex !== undefined ? sheet.sheetIndex : index,
                headers: sheet.headers,
                data: {
                    headers: sheet.headers,
                    rows: sheet.data,
                    rawData: sheet.rawData
                },
                computedData: sheet.computedData,
                formulas: sheet.formulas
            }))
        };

        console.log('Save Spreadsheet Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE_URL}/spreadsheet/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Save Spreadsheet API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Save Spreadsheet API Response:', result);
        return result;
        
    } catch (error) {
        console.error('Save Spreadsheet API Call Error:', error);
        throw error;
    }
};

// === 스프레드시트 조회 API 호출 ===
export const getSpreadsheetFromFirebase = async (
    spreadsheetId: string,
    options?: {
        userId?: string;
    }
): Promise<{
    success: boolean;
    data: any;
    error?: string;
}> => {
    try {
        const { user: currentUser } = useAuthStore.getState();
        
        if (!currentUser) {
            throw new Error('로그인이 필요합니다.');
        }

        const userId = options?.userId || currentUser.uid;
        const response = await fetch(`${API_BASE_URL}/spreadsheet/${spreadsheetId}?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Get Spreadsheet API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Get Spreadsheet API Response:', result);
        return result;
        
    } catch (error) {
        console.error('Get Spreadsheet API Call Error:', error);
        throw error;
    }
};