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

// === 백엔드 DTO와 일치하는 타입 인터페이스 ===

// 헤더 정보 인터페이스 (백엔드 HeaderInfo와 일치)
export interface HeaderInfo {
    column: string;
    name: string;
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
    headerRow?: number;
    dataRange?: DataRange;
}

// 시트 데이터 아이템 메타데이터 (백엔드 SheetDataItemMetadata와 일치)
export interface SheetDataItemMetadata {
    headers?: string[];
    rowCount?: number;
    columnCount?: number;
    sampleData?: string[][];
    fullData?: string[][];
    sheetIndex?: number;
    originalMetadata?: any[];
}

// 시트 데이터 아이템 (백엔드 SheetDataItem과 일치)
export interface SheetDataItem {
    name: string;
    csv?: string; // 선택사항
    metadata?: SheetDataItemMetadata;
}

// 다중 시트 데이터 구조 (백엔드 SheetsData와 일치)
export interface SheetsData {
    sheets: SheetDataItem[];
    activeSheet: string;
    totalSheets?: number;
    fileName?: string;
    spreadsheetId?: string;
}

// 확장된 시트 컨텍스트 (백엔드 ExtendedSheetContext와 일치)
export interface ExtendedSheetContext {
    sheetName: string;
    sheetIndex: number;
    headers: HeaderInfo[];
    dataRange: DataRange;
    sampleData?: Record<string, string>[];
    totalSheets: number;
    sheetList: string[];
    spreadsheetId?: string;
}

// 백엔드 ProcessDataDto와 완전히 일치하는 요청 DTO
export interface ProcessDataRequestDTO {
    userInput: string;
    extendedSheetContext?: ExtendedSheetContext;
    sheetsData?: SheetsData; // 백엔드에서 우선 처리되는 필드
    currentData?: SheetsData; // 기존 호환성 유지
    language?: string;
    userId?: string;
    chatId?: string;
    chatTitle?: string;
    messageId?: string;
    spreadsheetId?: string; // 스프레드시트 ID (저장된 spreadsheetId)
    targetSheetIndex?: number; // 현재 보고 있는 시트 인덱스
}

// 수정된 데이터 DTO (백엔드 EditedDataDto와 일치)
export interface EditedDataDto {
    sheetName: string;
    headers: string[];
    data: string[][];
}

// 변경 내역 DTO (백엔드 ChangesDto와 일치)
export interface ChangesDto {
    type: 'sort' | 'filter' | 'modify' | 'transform';
    details: string;
}

// 스프레드시트 메타데이터 (백엔드와 일치)
export interface SpreadsheetMetadata {
    fileName?: string;
    totalSheets?: number;
    activeSheetIndex?: number;
    sheetNames?: string[];
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

// 데이터 생성 응답 인터페이스 (백엔드 DTO와 일치)
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

// 데이터 수정 응답 인터페이스 (백엔드 DataFixResponseDto와 완전히 일치)
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

// === 채팅 제목 자동 생성 유틸리티 ===
const generateChatTitle = (userInput: string): string => {
    const title = userInput.length > 30 ? userInput.substring(0, 30) + '...' : userInput;
    return title || '새로운 채팅';
};

// === 최적화된 데이터 변환 함수 ===

// 최적화된 SheetsData 구조 생성 (백엔드 SheetsData DTO와 일치)
const createOptimizedSheetsData = (
    analysisData: any,
    extendedSheetContext: any | null,
    currentSheetIndex?: number
): SheetsData | null => {
    if (!analysisData) {
        console.warn('createOptimizedSheetsData: analysisData가 null 또는 undefined입니다.');
        return null;
    }

    // getDataForGPTAnalysis에서 반환하는 실제 구조에 맞게 수정
    // 구조: { sheets: [{ name, csv, metadata: { headers, fullData, sampleData, ... } }], activeSheet, ... }
    if (analysisData.sheets && Array.isArray(analysisData.sheets)) {
        if (analysisData.sheets.length === 0) {
            console.warn('createOptimizedSheetsData: sheets 배열이 비어있습니다.');
            return null;
        }

        const optimizedSheets: SheetDataItem[] = analysisData.sheets.map((sheet: any, index: number) => {
            const sheetName = sheet.name || `Sheet${index + 1}`;
            const metadata = sheet.metadata || {};
            
            // metadata에서 실제 데이터 추출
            const headers = Array.isArray(metadata.headers) ? metadata.headers : [];
            const fullData = Array.isArray(metadata.fullData) ? metadata.fullData : [];
            const sampleData = Array.isArray(metadata.sampleData) ? metadata.sampleData : fullData.slice(0, 5);
            const rowCount = metadata.rowCount || fullData.length;
            const columnCount = metadata.columnCount || headers.length;
            const sheetIndex = metadata.sheetIndex !== undefined ? metadata.sheetIndex : index;
            
            // 데이터가 비어있는 경우 경고 로그
            if (headers.length === 0 && fullData.length === 0) {
                console.warn(`시트 "${sheetName}"에 데이터가 없습니다.`);
            }
            
            return {
                name: sheetName,
                csv: sheet.csv, // 백엔드 DTO에서 선택사항
                metadata: {
                    headers: headers,
                    rowCount: rowCount,
                    columnCount: columnCount,
                    fullData: fullData, // GPT API에 실제로 전달되는 핵심 데이터
                    sampleData: sampleData, // 프롬프트 크기 제한용
                    sheetIndex: sheetIndex,
                    originalMetadata: metadata.originalMetadata
                }
            };
        });

        const result: SheetsData = {
            sheets: optimizedSheets,
            activeSheet: analysisData.activeSheet || optimizedSheets[0]?.name || 'Sheet1',
            totalSheets: analysisData.totalSheets || optimizedSheets.length,
            fileName: analysisData.fileName || 'Spreadsheet',
            spreadsheetId: analysisData.spreadsheetId
        };
        
        return result;
    }

    // 레거시 구조 처리 (단일 시트 데이터인 경우)
    if (analysisData.headers && analysisData.data && !analysisData.sheets) {
        const sheetName = extendedSheetContext?.sheetName || analysisData.fileName || 'Sheet1';
        const headers = Array.isArray(analysisData.headers) ? analysisData.headers : [];
        const data = Array.isArray(analysisData.data) ? analysisData.data : [];
        const sheetIndex = currentSheetIndex || 0;
        
        if (headers.length === 0 && data.length === 0) {
            console.warn('레거시 구조에서 데이터가 없습니다.');
        }
        
        return {
            sheets: [{
                name: sheetName,
                csv: undefined, // 선택사항
                metadata: {
                    headers: headers,
                    rowCount: data.length,
                    columnCount: headers.length,
                    fullData: data, // GPT API에 실제로 전달되는 핵심 데이터
                    sampleData: data.slice(0, 5), // 프롬프트 크기 제한용 (처음 5개 행만)
                    sheetIndex: sheetIndex,
                    originalMetadata: undefined
                }
            }],
            activeSheet: sheetName,
            totalSheets: 1,
            fileName: analysisData.fileName || sheetName,
            spreadsheetId: analysisData.spreadsheetId
        };
    }

    console.warn('createOptimizedSheetsData: 알 수 없는 데이터 구조입니다.', analysisData);
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
    currentSheetIndex?: number
): ProcessDataRequestDTO => {
    const { user: currentUser, loading: authLoading } = useAuthStore.getState();
    
    if (authLoading) {
        console.warn('Auth state is still loading. API call might fail if user is not yet available.');
    }

    if (!currentUser) {
        throw new Error('로그인이 필요합니다. (currentUser is null in createRequestBody)');
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
            console.log('- headers 수:', firstSheet.metadata?.headers?.length || 0);
            console.log('- fullData 행 수:', firstSheet.metadata?.fullData?.length || 0);
            console.log('- headers:', firstSheet.metadata?.headers);
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
            console.log('- headers 수:', extendedSheetContext.headers?.length || 0);
            console.log('- sampleData 수:', extendedSheetContext.sampleData?.length || 0);
            
            // extendedSheetContext의 sampleData를 기반으로 기본 데이터 구조 생성
            const headers = extendedSheetContext.headers?.map((h: any) => h.name || h.column || String(h)) || [];
            const sampleDataRows = extendedSheetContext.sampleData || [];
            
            // sampleData를 2차원 배열로 변환
            const convertedData = sampleDataRows.map((rowObj: any) => {
                if (Array.isArray(rowObj)) return rowObj;
                if (typeof rowObj === 'object' && rowObj !== null) {
                    return headers.map((header: string) => rowObj[header] || '');
                }
                return [];
            });
            
            analysisData = {
                sheets: [{
                    name: extendedSheetContext.sheetName,
                    csv: '', // 필요시 생성
                    metadata: {
                        headers: headers,
                        rowCount: convertedData.length,
                        columnCount: headers.length,
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
            console.log('- headers:', headers);
            console.log('- 변환된 데이터 행 수:', convertedData.length);
            if (convertedData.length > 0) {
                console.log('- 첫 번째 데이터 행:', convertedData[0]);
            }
        } else {
            console.warn('extendedSheetContext에서도 데이터를 찾을 수 없습니다.');
        }
        console.log('=== 폴백 처리 완료 ===');
    }

    // 최적화된 SheetsData 생성 (백엔드 SheetsData DTO와 일치)
    console.log('=== createOptimizedSheetsData 호출 시작 ===');
    const optimizedSheetsData = createOptimizedSheetsData(analysisData, extendedSheetContext, currentSheetIndex);
    
    if (optimizedSheetsData) {
        console.log('optimizedSheetsData 생성 성공:');
        console.log('- sheets 수:', optimizedSheetsData.sheets?.length || 0);
        console.log('- activeSheet:', optimizedSheetsData.activeSheet);
        console.log('- fileName:', optimizedSheetsData.fileName);
        
        if (optimizedSheetsData.sheets && optimizedSheetsData.sheets.length > 0) {
            const firstSheet = optimizedSheetsData.sheets[0];
            console.log('변환된 첫 번째 시트:');
            console.log('- name:', firstSheet.name);
            console.log('- headers 수:', firstSheet.metadata?.headers?.length || 0);
            console.log('- fullData 행 수:', firstSheet.metadata?.fullData?.length || 0);
        }
    } else {
        console.error('optimizedSheetsData 생성 실패');
    }
    console.log('=== createOptimizedSheetsData 호출 끝 ===');

    const requestBody: ProcessDataRequestDTO = {
        // === 기본 필드 ===
        userInput,
        language: 'ko',
        
        // === Firebase 필드 ===
        userId: currentUser.uid,
        chatId: chatId || undefined,
        chatTitle: chatTitle || undefined,
        messageId: messageId || undefined,
        spreadsheetId: analysisData?.spreadsheetId,
        targetSheetIndex: currentSheetIndex,
        
        // === 스프레드시트 데이터 (백엔드 호환성) ===
        sheetsData: optimizedSheetsData || undefined, // 백엔드에서 우선 처리
        currentData: optimizedSheetsData || undefined, // 기존 호환성 유지
        extendedSheetContext: extendedSheetContext || undefined
    };

    console.log('=== 최종 요청 본문 요약 ===');
    console.log('- userId:', requestBody.userId);
    console.log('- userInput 길이:', requestBody.userInput.length);
    console.log('- chatId:', requestBody.chatId);
    console.log('- spreadsheetId:', requestBody.spreadsheetId || '없음');
    console.log('- targetSheetIndex:', requestBody.targetSheetIndex !== undefined ? requestBody.targetSheetIndex : '없음');
    console.log('- sheetsData 존재:', !!requestBody.sheetsData);
    console.log('- currentData 존재:', !!requestBody.currentData);
    if (requestBody.sheetsData) {
        console.log('- sheetsData.sheets 수:', requestBody.sheetsData.sheets?.length || 0);
        if (requestBody.sheetsData.sheets && requestBody.sheetsData.sheets.length > 0) {
            const sheet = requestBody.sheetsData.sheets[0];
            console.log('- 첫 번째 시트 데이터 개수:', sheet.metadata?.fullData?.length || 0);
        }
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
            options?.currentSheetIndex // 현재 시트 인덱스 전달
        );

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Normal Chat API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId || '새 채팅'}`);
        console.log(`채팅 제목: ${requestBody.chatTitle || '없음'}`);
        console.log(`메시지 ID: ${requestBody.messageId || '없음'}`);
        console.log(`스프레드시트 ID: ${requestBody.spreadsheetId || '없음'}`);
        console.log(`대상 시트 인덱스: ${requestBody.targetSheetIndex !== undefined ? requestBody.targetSheetIndex : '없음'}`);
        
        if (requestBody.sheetsData) {
            console.log(`SheetsData - 시트 수: ${requestBody.sheetsData.sheets?.length || 0}`);
            console.log(`활성 시트: ${requestBody.sheetsData.activeSheet}`);
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

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Artifact API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId || '새 채팅'}`);
        console.log(`채팅 제목: ${requestBody.chatTitle || '없음'}`);
        console.log(`메시지 ID: ${requestBody.messageId || '없음'}`);
        console.log(`스프레드시트 ID: ${requestBody.spreadsheetId || '없음'}`);
        console.log(`대상 시트 인덱스: ${requestBody.targetSheetIndex !== undefined ? requestBody.targetSheetIndex : '없음'}`);
        
        if (requestBody.sheetsData) {
            console.log(`SheetsData - 시트 수: ${requestBody.sheetsData.sheets?.length || 0}`);
            console.log(`활성 시트: ${requestBody.sheetsData.activeSheet}`);
            console.log(`파일명: ${requestBody.sheetsData.fileName}`);
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

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Data Fix API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId || '새 채팅'}`);
        console.log(`채팅 제목: ${requestBody.chatTitle || '없음'}`);
        console.log(`메시지 ID: ${requestBody.messageId || '없음'}`);
        console.log(`스프레드시트 ID: ${requestBody.spreadsheetId || '없음'}`);
        console.log(`대상 시트 인덱스: ${requestBody.targetSheetIndex !== undefined ? requestBody.targetSheetIndex : '없음'}`);
        
        if (requestBody.sheetsData) {
            console.log(`SheetsData - 시트 수: ${requestBody.sheetsData.sheets?.length || 0}`);
            console.log(`활성 시트: ${requestBody.sheetsData.activeSheet}`);
            console.log(`파일명: ${requestBody.sheetsData.fileName}`);
            if (requestBody.sheetsData.sheets && requestBody.sheetsData.sheets.length > 0) {
                const firstSheet = requestBody.sheetsData.sheets[0];
                console.log(`첫 번째 시트 데이터 개수: ${firstSheet.metadata?.fullData?.length || 0}`);
            }
        } else {
            console.warn('⚠️ sheetsData가 없습니다. 빈 데이터가 전송될 수 있습니다.');
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

        // 백엔드와 동일한 형식으로 로깅
        console.log('==================== Data Generation API 요청 데이터 시작 ====================');
        console.log(`사용자 입력: ${requestBody.userInput}`);
        console.log(`사용자 ID: ${requestBody.userId}`);
        console.log(`채팅 ID: ${requestBody.chatId || '새 채팅'}`);
        console.log(`메시지 ID: ${requestBody.messageId || '없음'}`);
        console.log(`스프레드시트 ID: ${requestBody.spreadsheetId || '없음'}`);
        console.log(`대상 시트 인덱스: ${requestBody.targetSheetIndex !== undefined ? requestBody.targetSheetIndex : '없음'}`);
        
        if (requestBody.sheetsData) {
            console.log(`SheetsData - 시트 수: ${requestBody.sheetsData.sheets?.length || 0}`);
            console.log(`활성 시트: ${requestBody.sheetsData.activeSheet}`);
            console.log(`파일명: ${requestBody.sheetsData.fileName}`);
            if (requestBody.sheetsData.sheets && requestBody.sheetsData.sheets.length > 0) {
                const firstSheet = requestBody.sheetsData.sheets[0];
                console.log(`첫 번째 시트 데이터 개수: ${firstSheet.metadata?.fullData?.length || 0}`);
            }
        } else {
            console.warn('⚠️ sheetsData가 없습니다. 빈 데이터가 전송될 수 있습니다.');
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

        // 응답 상태 확인
        console.log('==================== Data Generation API 응답 상태 ====================');
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Data Generation API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
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
        
        // 백엔드와 동일한 형식으로 응답 로깅
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
        console.error('==================== Data Generation API 오류 끝 ====================');
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
        sheetId: string;
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
                data: {
                    headers: sheet.headers,
                    rows: sheet.data,
                    rawData: sheet.rawData || sheet.data
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