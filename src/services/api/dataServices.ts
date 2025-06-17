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

// === 백엔드 명세서에 맞는 새로운 인터페이스 정의 ===

// 단순화된 시트 데이터 구조 (백엔드 SimpleSheetData와 일치)
export interface SimpleSheetData {
    name: string;                // 시트명
    data: string[][];            // 데이터 배열 (2차원)
    spreadsheetId?: string;      // 스프레드시트 ID (선택사항)
    sheetIndex?: number;         // 시트 인덱스 (선택사항)
}

// 스프레드시트 데이터 구조 (백엔드 SpreadsheetData와 일치)
export interface SpreadsheetData {
    fileName: string;            // 파일명 (스프레드시트 ID 역할)
    activeSheet: string;         // 활성 시트명
    spreadsheetId: string;       // 스프레드시트 ID
    sheets: SimpleSheetData[];   // 시트 데이터 배열
}

// 백엔드 ProcessDataDto와 완전히 일치하는 요청 DTO
export interface ProcessDataRequestDTO {
    userInput: string;           // 사용자 입력 메시지
    spreadsheetData: SpreadsheetData;  // 스프레드시트 데이터
    language?: string;           // 언어 설정 (기본값: 'ko')
    userId?: string;              // 사용자 ID
    chatId: string;              // 채팅 ID
    chatTitle?: string;          // 채팅 제목 (선택사항)
    messageId?: string;          // 메시지 ID (선택사항)
}

// 데이터 범위 인터페이스 (백엔드 DataRange와 일치)
export interface DataRange {
    startRow: string;
    endRow: string;
    startColumn?: string;
    endColumn?: string;
    startColLetter?: string;
    endColLetter?: string;
}

// 시트 데이터 메타데이터 (백엔드 SheetMetadata와 일치)
export interface SheetMetadata {
    rowCount: number;
    columnCount: number;
    dataRange?: DataRange;
}

// 시트 데이터 아이템 메타데이터 (백엔드 SheetDataItemMetadata와 일치)
export interface SheetDataItemMetadata {
    rowCount?: number;
    columnCount?: number;
    sampleData?: string[][];
    fullData?: string[][];
    sheetIndex?: number;
    originalMetadata?: any[];
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
    spreadsheetMetadata?: SpreadsheetMetadata;
}

// === 일반 채팅 응답 인터페이스 - Firebase 필드 추가 ===
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
    spreadsheetMetadata?: SpreadsheetMetadata;
}

// === 함수 실행(Function) API 응답 인터페이스 - 백엔드 DTO에 맞게 수정 ===
export interface FunctionDetails {
    functionType: string;
    sourceRange: string;
    targetCell: string;
    result: string | number | string[][];
    formula: string;
}

export interface FunctionResponse {
    success: boolean;
    explanation: string;
    functionDetails: FunctionDetails;
    // Firebase 관련 필드
    chatId: string;
    userMessageId: string;
    aiMessageId: string;
    error?: string; // 클라이언트 측 에러 핸들링 용
}

// === 변경 내역 DTO (백엔드 ChangesDto와 일치)
export interface ChangesDto {
    type: 'sort' | 'filter' | 'modify' | 'transform';
    details: string;
}

// === 스프레드시트 메타데이터 (백엔드와 일치)
export interface SpreadsheetMetadata {
    hasSpreadsheet?: boolean;    // 스프레드시트 존재 여부 추가
    fileName?: string;
    totalSheets?: number;
    activeSheetIndex?: number;
    sheetNames?: string[];
}

// === 데이터 생성 응답 인터페이스 (백엔드 DTO와 일치)
export interface DataGenerationResponse {
    success: boolean;
    editedData?: EditedDataDto;
    sheetIndex?: number;
    explanation?: string;
    changeLog?: any[];
    error?: string;
    // Firebase 관련 필드 추가
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
    spreadsheetMetadata?: SpreadsheetMetadata;
}

// === 수정된 데이터 DTO (백엔드 EditedDataDto와 일치)
export interface EditedDataDto {
    sheetName: string;
    data: string[][];
}

// === 데이터 수정 응답 인터페이스 (백엔드 DataFixResponseDto와 완전히 일치)
export interface DataFixResponse {
    success: boolean;
    editedData?: EditedDataDto;
    sheetIndex?: number;
    explanation?: string;
    changes?: ChangesDto;
    error?: string;
    // Firebase 관련 필드 추가
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
    spreadsheetMetadata?: SpreadsheetMetadata;
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

// === 최적화된 요청 본문 생성 함수 ===
const createRequestBody = (
    userInput: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    chatId?: string,
    chatTitle?: string,
    messageId?: string,
    currentSheetIndex?: number,
    excludeSpreadsheetId?: boolean // 데이터 생성 시 spreadsheetId 제외 옵션 추가
): ProcessDataRequestDTO => {
    const { user: currentUser, loading: authLoading } = useAuthStore.getState();
    
    if (authLoading) {
        console.warn('Auth state is still loading. API call might fail if user is not yet available.');
    }

    // 비로그인 사용자도 API를 사용할 수 있도록 주석 처리
    // if (!currentUser) {
    //     throw new Error('로그인이 필요합니다. (currentUser is null in createRequestBody)');
    // }

    if (!chatId) {
        throw new Error('채팅 ID가 필요합니다.');
    }

    // 현재 시트 데이터만 가져오기 (allSheets=false가 기본값)
    let analysisData = null;
    if (getDataForGPTAnalysis) {
        console.log('=== getDataForGPTAnalysis 호출 시작 ===');
        console.log('currentSheetIndex:', currentSheetIndex);
        
        // currentSheetIndex가 제공되면 해당 시트, 아니면 현재 활성 시트만 전송
        analysisData = getDataForGPTAnalysis(currentSheetIndex, false); // false로 현재 시트만
        
        console.log('getDataForGPTAnalysis 결과:');
        console.log('- sheets 수:', analysisData?.sheets?.length || 0);
        console.log('- activeSheet:', analysisData?.activeSheet);
        console.log('- fileName:', analysisData?.fileName);
        console.log('- spreadsheetId:', analysisData?.spreadsheetId);
        
        if (analysisData?.sheets && analysisData.sheets.length > 0) {
            const firstSheet = analysisData.sheets[0];
            console.log('첫 번째 시트 정보:');
            console.log('- name:', firstSheet.name);
            console.log('- fullData 행 수:', firstSheet.metadata?.fullData?.length || 0);
            if (firstSheet.metadata?.fullData && firstSheet.metadata.fullData.length > 0) {
                console.log('- 첫 번째 데이터 행:', firstSheet.metadata.fullData[0]);
            }
        }
        console.log('=== getDataForGPTAnalysis 호출 끝 ===');
    } else {
        console.warn('getDataForGPTAnalysis 함수가 제공되지 않았습니다.');
    }

    // 폴백: getDataForGPTAnalysis에서 데이터를 가져오지 못한 경우 extendedSheetContext에서 추출
    if (!analysisData || !analysisData.sheets || analysisData.sheets.length === 0) {
        console.log('=== 폴백: extendedSheetContext에서 데이터 추출 시도 ===');
        if (extendedSheetContext && extendedSheetContext.sampleData) {
            console.log('extendedSheetContext에서 sampleData 발견');
            console.log('- sheetName:', extendedSheetContext.sheetName);
            console.log('- sampleData 수:', extendedSheetContext.sampleData?.length || 0);
            
            // extendedSheetContext의 sampleData를 기반으로 기본 데이터 구조 생성
            const sampleDataRows = extendedSheetContext.sampleData || [];
            
            // sampleData를 2차원 배열로 변환
            const convertedData = sampleDataRows.map((rowObj: any) => {
                if (Array.isArray(rowObj)) return rowObj;
                return [];
            });
            
            analysisData = {
                sheets: [{
                    name: extendedSheetContext.sheetName,
                    csv: '', // 필요시 생성
                    metadata: {
                        rowCount: convertedData.length,
                        columnCount: convertedData[0]?.length || 0,
                        fullData: convertedData,
                        sampleData: convertedData.slice(0, 5),
                        sheetIndex: extendedSheetContext.sheetIndex || 0,
                        originalMetadata: null
                    }
                }],
                activeSheet: extendedSheetContext.sheetName,
                totalSheets: extendedSheetContext.totalSheets || 1,
                fileName: `${extendedSheetContext.sheetName}.xlsx`,
                spreadsheetId: extendedSheetContext.spreadsheetId
            };
            
            console.log('폴백 데이터 생성 완료:');
            console.log('- 변환된 데이터 행 수:', convertedData.length);
            if (convertedData.length > 0) {
                console.log('- 첫 번째 데이터 행:', convertedData[0]);
            }
        } else {
            console.warn('extendedSheetContext에서도 데이터를 찾을 수 없습니다.');
        }
        console.log('=== 폴백 처리 완료 ===');
    }

    // analysisData를 새로운 SpreadsheetData 형식으로 변환
    const spreadsheetData: SpreadsheetData = {
        fileName: analysisData?.fileName || 'Spreadsheet',
        activeSheet: analysisData?.activeSheet || 'Sheet1',
        spreadsheetId: excludeSpreadsheetId ? '' : (analysisData?.spreadsheetId || ''),
        sheets: analysisData?.sheets?.map((sheet: any) => {
            return {
                name: sheet.name,
                data: sheet.metadata?.fullData || []
            };
        }) || [{
            name: 'Sheet1',
            data: []
        }]
    };

    const requestBody: ProcessDataRequestDTO = {
        // === 기본 필드 ===
        userInput,
        language: 'ko',
        
        // === Firebase 필드 ===
        userId: currentUser?.uid,
        chatId: chatId,
        
        // === 스프레드시트 데이터 ===
        spreadsheetData: spreadsheetData
    };

    console.log('=== 최종 요청 본문 요약 ===');
    console.log('- userId:', requestBody.userId);
    console.log('- userInput 길이:', requestBody.userInput.length);
    console.log('- chatId:', requestBody.chatId);
    console.log('- spreadsheetData 파일명:', requestBody.spreadsheetData.fileName);
    console.log('- spreadsheetData 시트 수:', requestBody.spreadsheetData.sheets.length);
    console.log('- spreadsheetId 제외 여부:', excludeSpreadsheetId);
    console.log('- spreadsheetId:', requestBody.spreadsheetData.spreadsheetId);
    if (requestBody.spreadsheetData.sheets.length > 0) {
        const sheet = requestBody.spreadsheetData.sheets[0];
        console.log('- 첫 번째 시트 데이터 개수:', sheet.data.length);
    }
    console.log('=== 최종 요청 본문 요약 끝 ===');

    return requestBody;
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
            options?.currentSheetIndex, // 현재 시트 인덱스 전달
            false // excludeSpreadsheetId = false (기본 동작 유지)
        );

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Normal Chat API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId}`);
        console.log(`언어: ${requestBody.language || 'ko'}`);
        
        if (requestBody.spreadsheetData.sheets.length > 0) {
            console.log(`SpreadsheetData - 시트 수: ${requestBody.spreadsheetData.sheets.length}`);
            console.log(`활성 시트: ${requestBody.spreadsheetData.activeSheet}`);
        }
        
        console.log('전체 요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log('==================== Normal Chat API 요청 데이터 끝 ====================');

        const response = await fetch(`${API_BASE_URL}/normal/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Normal Chat API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
            console.error('==================== Normal Chat API 오류 정보 끝 ====================');
            
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
        
        // 백엔드와 동일한 형식으로 응답 로깅
        console.log('==================== Normal Chat API 응답 데이터 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`메시지: ${result.message}`);
        console.log(`채팅 ID: ${result.chatId || '없음'}`);
        console.log(`사용자 메시지 ID: ${result.userMessageId || '없음'}`);
        console.log(`AI 메시지 ID: ${result.aiMessageId || '없음'}`);
        console.log(`타임스탬프: ${result.timestamp || '없음'}`);
        if (result.error) {
            console.log(`오류 메시지: ${result.error}`);
        }
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        console.log('==================== Normal Chat API 응답 데이터 끝 ====================');
        
        return result;
        
    } catch (error) {
        console.error('==================== Normal Chat API 호출 오류 ====================');
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('==================== Normal Chat API 오류 끝 ====================');
        throw error; // 이미 Error 객체이므로 그대로 throw
    }
};

// === 아티팩트 생성 API 호출 - Firebase 연동 버전 ===
export const callArtifactAPI = async (
    userInput: string,
    getDataForGPTAnalysis: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number; // 현재 시트 인덱스 추가
    }
): Promise<ArtifactResponse> => {
    try {
        const requestBody = createRequestBody(
            userInput,
            null, // extendedSheetContext는 이제 사용하지 않음
            getDataForGPTAnalysis,
            options?.chatId,
            undefined, // 아티팩트는 새 채팅 생성하지 않음
            options?.messageId,
            options?.currentSheetIndex, // 현재 시트 인덱스 전달
            false // excludeSpreadsheetId = false (기본 동작 유지)
        );

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Artifact API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId}`);
        console.log(`언어: ${requestBody.language || 'ko'}`);
        console.log(`스프레드시트 ID: ${requestBody.spreadsheetData.spreadsheetId || '없음'}`);
        
        if (requestBody.spreadsheetData.sheets.length > 0) {
            console.log(`SpreadsheetData - 시트 수: ${requestBody.spreadsheetData.sheets.length}`);
            console.log(`활성 시트: ${requestBody.spreadsheetData.activeSheet}`);
            console.log(`파일명: ${requestBody.spreadsheetData.fileName}`);
        }
        
        console.log('전체 요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log('==================== Artifact API 요청 데이터 끝 ====================');

        const response = await fetch(`${API_BASE_URL}/artifact/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        // 응답 상태 자세히 확인
        console.log('==================== Artifact API 응답 상태 ====================');
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Artifact API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
            console.error('==================== Artifact API 오류 정보 끝 ====================');
            
            let errorMessage = `API 오류: ${response.status} - ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
                } else if (errorText) {
                    errorMessage = errorText;
                }
            } catch (e) {
                if (errorText) errorMessage = errorText;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // 백엔드와 동일한 형식으로 응답 로깅
        console.log('==================== Artifact API 응답 데이터 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`타입: ${result.type || '없음'}`);
        console.log(`제목: ${result.title || '없음'}`);
        console.log(`설명: ${result.explanation?.korean || '없음'}`);
        console.log(`채팅 ID: ${result.chatId || '없음'}`);
        console.log(`사용자 메시지 ID: ${result.userMessageId || '없음'}`);
        console.log(`AI 메시지 ID: ${result.aiMessageId || '없음'}`);
        console.log(`코드 길이: ${result.code?.length || 0}자`);
        console.log(`타임스탬프: ${result.timestamp || '없음'}`);
        if (result.error) {
            console.log(`오류 메시지: ${result.error}`);
        }
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        console.log('==================== Artifact API 응답 데이터 끝 ====================');
        
        return result;
        
    } catch (error) {
        console.error('==================== Artifact API 호출 오류 ====================');
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('==================== Artifact API 오류 끝 ====================');
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
            options?.currentSheetIndex, // 현재 시트 인덱스 전달
            false // excludeSpreadsheetId = false (기본 동작 유지)
        );

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Data Fix API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId}`);
        console.log(`언어: ${requestBody.language || 'ko'}`);
        console.log(`스프레드시트 ID: ${requestBody.spreadsheetData.spreadsheetId || '없음'}`);
        
        if (requestBody.spreadsheetData.sheets.length > 0) {
            console.log(`SpreadsheetData - 시트 수: ${requestBody.spreadsheetData.sheets.length}`);
            console.log(`활성 시트: ${requestBody.spreadsheetData.activeSheet}`);
            console.log(`파일명: ${requestBody.spreadsheetData.fileName}`);
            const firstSheet = requestBody.spreadsheetData.sheets[0];
            console.log(`첫 번째 시트 데이터 개수: ${firstSheet.data.length}`);
        } else {
            console.warn('⚠️ spreadsheetData가 없습니다. 빈 데이터가 전송될 수 있습니다.');
        }
        
        console.log('전체 요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log('==================== Data Fix API 요청 데이터 끝 ====================');

        const response = await fetch(`${API_BASE_URL}/datafix/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        // 응답 상태 확인
        console.log('==================== Data Fix API 응답 상태 ====================');
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Data Fix API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
            console.error('==================== Data Fix API 오류 정보 끝 ====================');
            
            let errorMessage = `API 오류: ${response.status} - ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
                } else if (errorText) {
                    errorMessage = errorText;
                }
            } catch (e) {
                if (errorText) errorMessage = errorText;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // 백엔드와 동일한 형식으로 응답 로깅
        console.log('==================== Data Fix API 응답 데이터 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`시트 인덱스: ${result.sheetIndex || '없음'}`);
        console.log(`설명: ${result.explanation || '없음'}`);
        console.log(`채팅 ID: ${result.chatId || '없음'}`);
        console.log(`사용자 메시지 ID: ${result.userMessageId || '없음'}`);
        console.log(`AI 메시지 ID: ${result.aiMessageId || '없음'}`);
        if (result.editedData) {
            console.log(`수정된 시트명: ${result.editedData.sheetName}`);
            console.log(`수정된 데이터 행 수: ${result.editedData.data?.length || 0}`);
            console.log(`수정된 헤더 수: ${result.editedData.headers?.length || 0}`);
        }
        if (result.error) {
            console.log(`오류 메시지: ${result.error}`);
        }
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        console.log('==================== Data Fix API 응답 데이터 끝 ====================');
        
        return result;
        
    } catch (error) {
        console.error('==================== Data Fix API 호출 오류 ====================');
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('==================== Data Fix API 오류 끝 ====================');
        throw error;
    }
};

// === 함수 실행(Function) API 호출 - 기존 Formula 대체 ===
// 이 API는 기존에 엑셀 함수로 처리하던 작업을 GPT를 통해 실행합니다.
export const callFunctionAPI = async (
    userInput: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number;
    }
): Promise<FunctionResponse> => {
    try {
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            getDataForGPTAnalysis,
            options?.chatId,
            undefined,
            options?.messageId,
            options?.currentSheetIndex,
            false // excludeSpreadsheetId = false
        );

        // function/process 엔드포인트는 `language` 속성을 허용하지 않으므로, 요청 본문에서 제거합니다.
        const { language, ...functionRequestBody } = requestBody;

        console.log('==================== Function API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${functionRequestBody.userInput}`);
        console.log(`사용자 ID: ${functionRequestBody.userId}`);
        console.log(`채팅 ID: ${functionRequestBody.chatId}`);
        
        if (functionRequestBody.spreadsheetData.sheets.length > 0) {
            console.log(`SpreadsheetData - 시트 수: ${functionRequestBody.spreadsheetData.sheets.length}`);
            console.log(`활성 시트: ${functionRequestBody.spreadsheetData.activeSheet}`);
        }
        
        console.log('전체 요청 본문:', JSON.stringify(functionRequestBody, null, 2));
        console.log('==================== Function API 요청 데이터 끝 ====================');

        const response = await fetch(`${API_BASE_URL}/function/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(functionRequestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Function API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
            console.error('==================== Function API 오류 정보 끝 ====================');
            
            let errorMessage = `API 오류: ${response.status} - ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
                } else if (errorText) {
                    errorMessage = errorText;
                }
            } catch (e) {
                if (errorText) errorMessage = errorText;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json() as FunctionResponse;
        
        console.log('==================== Function API 응답 데이터 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`설명: ${result.explanation || '없음'}`);
        if (result.success && result.functionDetails) {
            console.log(`함수 상세: ${JSON.stringify(result.functionDetails, null, 2)}`);
        }
        console.log(`채팅 ID: ${result.chatId || '없음'}`);
        if (result.error) {
            console.log(`오류 메시지: ${result.error}`);
        }
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        console.log('==================== Function API 응답 데이터 끝 ====================');
        
        return result;
        
    } catch (error) {
        console.error('==================== Function API 호출 오류 ====================');
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('==================== Function API 오류 끝 ====================');
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
        currentSheetIndex?: number;
    }
): Promise<DataGenerationResponse> => {
    try {
        // 데이터 생성 시에는 spreadsheetId를 제외하도록 true 전달
        const requestBody = createRequestBody(
            userInput,
            extendedSheetContext,
            getDataForGPTAnalysis,
            options?.chatId,
            undefined,
            options?.messageId,
            options?.currentSheetIndex,
            true // excludeSpreadsheetId = true로 설정
        );

        console.log('==================== Data Generation API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId}`);
        console.log(`언어: ${requestBody.language}`);
        console.log(`SpreadsheetId 제외됨: ${!requestBody.spreadsheetData.spreadsheetId}`);
        
        // ⚠️ 중요: 백엔드 DTO 구조 확인 필요
        console.log('⚠️ 백엔드 GenerateDataDto와 구조 일치 확인 필요:');
        console.log('- 프론트엔드: ProcessDataRequestDTO.spreadsheetData 구조 사용');
        console.log('- 백엔드: GenerateDataDto.extendedSheetContext/sheetsData 구조 기대');
        console.log('- 백엔드에서 새로운 spreadsheetData 구조 처리 가능한지 확인 필요');
        
        if (requestBody.spreadsheetData.sheets.length > 0) {
            console.log(`SpreadsheetData - 시트 수: ${requestBody.spreadsheetData.sheets.length}`);
            console.log(`활성 시트: ${requestBody.spreadsheetData.activeSheet}`);
            console.log(`파일명: ${requestBody.spreadsheetData.fileName}`);
            const firstSheet = requestBody.spreadsheetData.sheets[0];
            console.log(`첫 번째 시트 데이터 개수: ${firstSheet.data.length}`);
        }
        
        console.log('전체 요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log('==================== Data Generation API 요청 데이터 끝 ====================');

        const response = await fetch(`${API_BASE_URL}/datagenerate/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Data Generation API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
            
            // DTO 구조 불일치로 인한 오류일 가능성 체크
            if (response.status === 400 && errorText.includes('validation')) {
                console.error('⚠️ DTO 구조 불일치 가능성:');
                console.error('- 백엔드가 ProcessDataRequestDTO.spreadsheetData 구조를 인식하지 못할 수 있음');
                console.error('- GenerateDataDto 구조로 변환 필요할 수 있음');
            }
            
            console.error('==================== Data Generation API 오류 정보 끝 ====================');
            
            let errorMessage = `API 오류: ${response.status} - ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
                } else if (errorText) {
                    errorMessage = errorText;
                }
            } catch (e) {
                if (errorText) errorMessage = errorText;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        
        console.log('==================== Data Generation API 응답 데이터 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`시트 인덱스: ${result.sheetIndex || '없음'}`);
        console.log(`설명: ${result.explanation || '없음'}`);
        console.log(`채팅 ID: ${result.chatId || '없음'}`);
        console.log(`사용자 메시지 ID: ${result.userMessageId || '없음'}`);
        console.log(`AI 메시지 ID: ${result.aiMessageId || '없음'}`);
        if (result.editedData) {
            console.log(`생성된 시트명: ${result.editedData.sheetName}`);
            console.log(`생성된 데이터 행 수: ${result.editedData.data?.length || 0}`);
            console.log(`생성된 헤더 수: ${result.editedData.headers?.length || 0}`);
        }
        if (result.changeLog) {
            console.log(`변경 로그 항목 수: ${result.changeLog.length}`);
        }
        if (result.error) {
            console.log(`오류 메시지: ${result.error}`);
        }
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        console.log('==================== Data Generation API 응답 데이터 끝 ====================');
        
        return result;
        
    } catch (error) {
        console.error('==================== Data Generation API 호출 오류 ====================');
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // DTO 구조 문제 진단 도움말
        if (error instanceof Error && error.message.includes('400')) {
            console.error('💡 문제 해결 방안:');
            console.error('1. 백엔드가 ProcessDataRequestDTO.spreadsheetData 구조를 인식하지 못할 수 있음');
            console.error('2. 또는 백엔드에서 ProcessDataRequestDTO 구조 지원');
            console.error('3. 또는 프론트엔드에서 기존 extendedSheetContext/sheetsData 구조로 변환');
        }
        
        console.error('==================== Data Generation API 오류 끝 ====================');
        throw error;
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
        spreadsheetId?: string;
    }
): Promise<{
    success: boolean;
    data: any;
    message?: string;
    error?: string;
}> => {
    try {
        const { user: currentUser } = useAuthStore.getState();
        
        const userId = options?.userId || currentUser?.uid;

        if (!userId) {
            throw new Error('사용자 ID가 없어 스프레드시트를 저장할 수 없습니다. 로그인이 필요합니다.');
        }

        const requestBody = {
            userId: userId,
            chatId: options?.chatId,
            fileName: parsedData.fileName,
            originalFileName: fileInfo.originalFileName,
            fileSize: fileInfo.fileSize,
            fileType: fileInfo.fileType,
            activeSheetIndex: parsedData.activeSheetIndex || 0,
            sheets: parsedData.sheets.map((sheet: any, index: number) => {
                const rawData = sheet.rawData || [];

                return {
                    name: sheet.sheetName,
                    index: sheet.sheetIndex !== undefined ? sheet.sheetIndex : index,
                    data: rawData,
                };
            })
        };

        console.log('Save Spreadsheet Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE_URL}/spreadsheet/data/save`, {
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

// === 스프레드시트 전체 교체 DTO ===
export interface ReplaceSpreadsheetDto {
    sheets: Array<{
        sheetName: string;
        sheetIndex: number;
        data: any[][];
        computedData?: any[][];
        formulas?: any[][];
    }>;
    description?: string;
}

// === 스프레드시트 교체 응답 인터페이스 ===
export interface ReplaceSpreadsheetResponse {
    success: boolean;
    message: string;
    spreadsheetId: string;
    sheetsCount: number;
    description?: string;
    replacedAt: string;
    sheets: Array<{
        sheetId: string;
        sheetIndex: number;
        sheetName: string;
        rowCount: number;
        hasFormulas: boolean;
        hasComputedData: boolean;
    }>;
    error?: string;
}

// === 스프레드시트 교체 API 호출 ===
export const replaceSpreadsheet = async (
    spreadsheetId: string,
    replaceData: ReplaceSpreadsheetDto,
    userId: string,
): Promise<ReplaceSpreadsheetResponse> => {
    try {
        if (!userId) {
            throw new Error('User ID is required for replacing spreadsheet.');
        }

        const response = await fetch(`${API_BASE_URL}/spreadsheet/${spreadsheetId}/replace?userId=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(replaceData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Replace Spreadsheet API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Replace Spreadsheet API Response:', result);
        return result;

    } catch (error) {
        console.error('Replace Spreadsheet API Call Error:', error);
        throw error;
    }
};