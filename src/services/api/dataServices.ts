// API 서비스 모듈 - Firebase 연동 버전
import { validateExtendedSheetContext } from '../../utils/chatUtils';
// import { useAuthStore } from '@/stores/authStore'; // 선택적 import로 변경

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// === Firebase 관련 인터페이스 추가 ===

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// === 게스트 사용자 관련 유틸리티 추가 ===

// 게스트 사용자 ID 생성 함수
const generateGuestUserId = (): string => {
    // 브라우저의 fingerprint 기반으로 일관된 ID 생성
    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        new Date().getTimezoneOffset().toString()
    ].join('|');
    
    // 간단한 해시 함수 (실제로는 더 복잡한 해시를 사용할 수 있음)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
    }
    
    return `guest_${Math.abs(hash)}_${Date.now()}`;
};

// 현재 사용자 ID 가져오기 (로그인/게스트 모두 지원)
export const getCurrentUserId = (): string => {
    try {
        // 먼저 로그인된 사용자 확인 (authStore가 사용 가능한 경우)
        if (typeof window !== 'undefined') {
            // authStore 동적 import 시도
            try {
                const { useAuthStore } = require('@/stores/authStore');
                const { user } = useAuthStore.getState();
                if (user?.uid) {
                    return user.uid;
                }
            } catch (error) {
                console.log('authStore를 사용할 수 없습니다. 게스트 모드로 진행합니다.');
            }
            
            // 로컬 스토리지에서 기존 게스트 ID 확인
            const existingGuestId = localStorage.getItem('guest_user_id');
            if (existingGuestId) {
                return existingGuestId;
            }
            
            // 새 게스트 ID 생성 및 저장
            const guestId = generateGuestUserId();
            localStorage.setItem('guest_user_id', guestId);
            return guestId;
        }
        
        // 서버 사이드에서는 임시 ID 반환
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
        console.warn('사용자 ID 생성 실패, 기본 게스트 ID 사용:', error);
        return `guest_default_${Date.now()}`;
    }
};

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

// === Firebase 사용자 정보 가져오기 유틸리티 (수정) ===
export const getCurrentUser = (): FirebaseUser | null => {
    // Firebase Auth에서 현재 사용자 정보 가져오기 (선택적)
    if (typeof window !== 'undefined') {
        try {
            const user = localStorage.getItem('firebase_user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.log('Firebase 사용자 정보를 가져올 수 없습니다:', error);
            return null;
        }
    }
    return null;
};

// === 새로운 통합 오케스트레이터 채팅 API 인터페이스 ===

// 오케스트레이터 채팅 요청 DTO (백엔드와 일치)
export interface OrchestratorChatRequestDto {
    message: string;
    sheetId?: string;
    chatId?: string;
    userId: string;
    countryCode: string; // ISO 3166-1 alpha-2 국가 코드 ('KR', 'US', 'JP', 'CN', 'DE', 'FR', 'GB', 'ES', 'IT', 'BR', 'IN', 'RU')
    language?: string; // ISO 639-1 언어 코드 ('ko', 'en', 'ja', 'zh', 'de', 'fr', 'es', 'it', 'pt', 'hi', 'ru')
    timezone?: string; // IANA 시간대 (예: 'Asia/Seoul', 'America/New_York')
    timestamp: string; // ISO 8601 날짜 문자열
}

// 오케스트레이터 채팅 응답 DTO
export interface OrchestratorChatResponseDto {
    success: boolean;
    chatType: 'normal' | 'artifact' | 'datafix' | 'dataedit' | 'data-edit' | 'edit-chat' | 'function' | 'function-chat' | 'datageneration' | 'general-chat' | 'visualization-chat' | 'generate-chat' | null;
    
    // 일반 채팅 응답 필드들
    message?: string;
    
    // 아티팩트 응답 필드들
    code?: string;
    type?: 'chart' | 'table' | 'analysis';
    explanation?: {
        korean: string;
    };
    title?: string;
    
    // 데이터 수정 응답 필드들
    editedData?: EditedDataDto;
    sheetIndex?: number;
    changes?: ChangesDto;
    changeLog?: any[];
    
    // 함수 실행 응답 필드들
    functionDetails?: FunctionDetails;
    
    // 공통 필드들
    error?: string;
    chatId?: string;
    messageId?: string;
    userMessageId?: string;
    aiMessageId?: string;
    timestamp?: string;
    spreadsheetMetadata?: SpreadsheetMetadata;
    
    // === SheetId 추가 ===
    sheetId?: string; // 백엔드에서 반환하는 스프레드시트 ID (최상위 레벨)
    
    // === 데이터 필드 (백엔드 응답에서 data 객체로 감싸진 경우) ===
    data?: {
        editedData?: EditedDataDto;
        sheetIndex?: number;
        explanation?: string;
        changeLog?: any[];
        spreadsheetId?: string; // data 객체 내의 spreadsheetId
        // 기타 data 필드들...
        [key: string]: any;
    };
}

// 국가별 시간대 매핑 (기본값)
const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
    'KR': 'Asia/Seoul',
    'US': 'America/New_York',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'GB': 'Europe/London',
    'ES': 'Europe/Madrid',
    'IT': 'Europe/Rome',
    'BR': 'America/Sao_Paulo',
    'IN': 'Asia/Kolkata',
    'RU': 'Europe/Moscow'
};

// 국가별 언어 매핑 (기본값)
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
    'KR': 'ko',
    'US': 'en',
    'JP': 'ja',
    'CN': 'zh',
    'DE': 'de',
    'FR': 'fr',
    'GB': 'en',
    'ES': 'es',
    'IT': 'it',
    'BR': 'pt',
    'IN': 'hi',
    'RU': 'ru'
};

// 사용자의 국가 코드 감지 함수 (기본값: 'KR')
const detectUserCountryCode = (): string => {
    try {
        // 브라우저의 언어/지역 설정에서 국가 코드 추출
        const locale = navigator.language || navigator.languages?.[0] || 'ko-KR';
        const countryMatch = locale.match(/-([A-Z]{2})$/);
        if (countryMatch) {
            const countryCode = countryMatch[1];
            // 지원하는 국가 코드인지 확인
            if (Object.keys(COUNTRY_TIMEZONE_MAP).includes(countryCode)) {
                return countryCode;
            }
        }
        
        // 언어 코드만 있는 경우 매핑
        const langCode = locale.split('-')[0];
        const countryFromLang: Record<string, string> = {
            'ko': 'KR',
            'en': 'US',
            'ja': 'JP',
            'zh': 'CN',
            'de': 'DE',
            'fr': 'FR',
            'es': 'ES',
            'it': 'IT',
            'pt': 'BR',
            'hi': 'IN',
            'ru': 'RU'
        };
        
        return countryFromLang[langCode] || 'KR';
    } catch (error) {
        console.warn('국가 코드 감지 실패, 기본값 KR 사용:', error);
        return 'KR';
    }
};

// 사용자의 시간대 감지 함수
const detectUserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.warn('시간대 감지 실패, 기본값 사용:', error);
        return 'Asia/Seoul';
    }
};

// ======================================
// 🚀 **권장 API**: 통합 오케스트레이터 채팅 API (수정)
// ======================================
// 이 API는 모든 채팅 타입(normal, artifact, datafix, function, datageneration)을 
// 자동으로 판단하여 처리하는 통합 엔드포인트입니다.
// 새로운 개발에서는 이 API만 사용하시기 바랍니다.

export const callOrchestratorChatAPI = async (
    message: string,
    extendedSheetContext: any | null,
    getDataForGPTAnalysis?: (sheetIndex?: number, includeAllSheets?: boolean) => any,
    options?: {
        chatId?: string;
        messageId?: string;
        currentSheetIndex?: number;
        countryCode?: string;
        language?: string;
        timezone?: string;
        userId?: string; // 외부에서 userId 전달 가능
        sheetId?: string; // 기존 sheetId 전달 가능
    }
): Promise<OrchestratorChatResponseDto> => {
    try {
        // 사용자 ID 가져오기 (로그인/게스트 모두 지원)
        let currentUserId: string;
        
        if (options?.userId) {
            // 외부에서 userId가 제공된 경우 사용
            currentUserId = options.userId;
        } else {
            // 자동으로 사용자 ID 가져오기 (로그인 또는 게스트)
            currentUserId = getCurrentUserId();
        }

        if (!currentUserId) {
            throw new Error('사용자 ID를 생성할 수 없습니다.');
        }

        if (!options?.chatId) {
            throw new Error('채팅 ID가 필요합니다.');
        }

        // 스프레드시트 데이터 처리
        let analysisData = null;
        if (getDataForGPTAnalysis) {
            analysisData = getDataForGPTAnalysis(options.currentSheetIndex, false);
        }

        // 폴백: extendedSheetContext에서 데이터 추출
        if (!analysisData || !analysisData.sheets || analysisData.sheets.length === 0) {
            if (extendedSheetContext && extendedSheetContext.sampleData) {
                const sampleDataRows = extendedSheetContext.sampleData || [];
                const convertedData = sampleDataRows.map((rowObj: any) => {
                    if (Array.isArray(rowObj)) return rowObj;
                    return [];
                });
                
                analysisData = {
                    sheets: [{
                        name: extendedSheetContext.sheetName,
                        csv: '',
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
            }
        }

        // 국가/언어/시간대 정보 설정
        const countryCode = options.countryCode || detectUserCountryCode();
        const language = options.language || COUNTRY_LANGUAGE_MAP[countryCode] || 'ko';
        const timezone = options.timezone || detectUserTimezone();

        // SheetId 처리 - 우선순위: 옵션 > 로컬스토리지/상태관리 > 스프레드시트 데이터
        let sheetIdToUse: string | undefined;
        
        console.log('🔍 SheetId 검색 시작...');
        
        if (options?.sheetId) {
            // 1. 옵션으로 전달된 sheetId 우선 사용
            sheetIdToUse = options.sheetId;
            console.log(`✅ 옵션에서 sheetId 발견: ${sheetIdToUse}`);
        } else {
            // 2. 상태관리 저장소에서 가져오기 (동적 import로 안전하게)
            try {
                if (typeof window !== 'undefined') {
                    const { useUnifiedStore } = require('@/stores');
                    const { getCurrentSheetId } = useUnifiedStore.getState();
                    const storeSheetId = getCurrentSheetId();
                    if (storeSheetId) {
                        sheetIdToUse = storeSheetId;
                        console.log(`✅ 상태관리에서 sheetId 발견: ${sheetIdToUse}`);
                    } else {
                        console.log('❌ 상태관리에서 sheetId 없음');
                    }
                }
            } catch (error) {
                console.log('❌ 상태관리 저장소에서 sheetId를 가져올 수 없습니다:', error);
            }
            
            // 3. 폴백: 스프레드시트 데이터에서 가져오기
            if (!sheetIdToUse && analysisData?.spreadsheetId) {
                sheetIdToUse = analysisData.spreadsheetId;
                console.log(`✅ 스프레드시트 데이터에서 sheetId 발견: ${sheetIdToUse}`);
            } else if (!sheetIdToUse) {
                console.log('❌ 어디서도 sheetId를 찾을 수 없음');
            }
        }

        // 오케스트레이터 요청 DTO 구성
        const requestBody: OrchestratorChatRequestDto = {
            message: message,
            chatId: options.chatId,
            userId: currentUserId, // 수정된 부분
            countryCode: countryCode,
            language: language,
            timezone: timezone,
            timestamp: new Date().toISOString(),
            // sheetId가 있으면 포함
            ...(sheetIdToUse && { sheetId: sheetIdToUse })
        };

        console.log('==================== Orchestrator Chat API 요청 데이터 시작 ====================');
        console.log(`메시지: ${requestBody.message}`);
        console.log(`사용자 ID: ${requestBody.userId} (${currentUserId.startsWith('guest_') ? '게스트' : '로그인'})`);
        console.log(`채팅 ID: ${requestBody.chatId}`);
        console.log(`시트 ID: ${requestBody.sheetId || '없음'}`);
        if (sheetIdToUse) {
            console.log(`📍 사용된 SheetId 출처: ${options?.sheetId ? '옵션에서 전달' : '상태관리/스프레드시트 데이터'}`);
        }
        console.log(`국가 코드: ${requestBody.countryCode}`);
        console.log(`언어: ${requestBody.language}`);
        console.log(`시간대: ${requestBody.timezone}`);
        console.log(`타임스탬프: ${requestBody.timestamp}`);
        
        if (analysisData?.sheets && analysisData.sheets.length > 0) {
            console.log(`스프레드시트 데이터 - 시트 수: ${analysisData.sheets.length}`);
            console.log(`활성 시트: ${analysisData.activeSheet}`);
        }
        
        console.log('전체 요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log('==================== Orchestrator Chat API 요청 데이터 끝 ====================');

        const response = await fetch(`${API_BASE_URL}/orchestrator-chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('==================== Orchestrator Chat API 오류 상세 정보 ====================');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Error Body:', errorText);
            console.error('==================== Orchestrator Chat API 오류 정보 끝 ====================');
            
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

        const result = await response.json() as OrchestratorChatResponseDto;
        
        console.log('==================== Orchestrator Chat API 응답 데이터 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`채팅 타입: ${result.chatType || '없음'}`);
        console.log(`메시지: ${result.message || '없음'}`);
        console.log(`채팅 ID: ${result.chatId || '없음'}`);
        console.log(`사용자 메시지 ID: ${result.userMessageId || '없음'}`);
        console.log(`AI 메시지 ID: ${result.aiMessageId || '없음'}`);
        console.log(`타임스탬프: ${result.timestamp || '없음'}`);
        if (result.error) {
            console.log(`오류 메시지: ${result.error}`);
        }
        if (result.code) {
            console.log(`아티팩트 코드 길이: ${result.code.length}자`);
        }
        if (result.editedData) {
            console.log(`수정된 데이터 - 시트명: ${result.editedData.sheetName}, 행 수: ${result.editedData.data?.length || 0}`);
        }
        if (result.functionDetails) {
            console.log(`함수 실행 - 타입: ${result.functionDetails.functionType}, 대상: ${result.functionDetails.targetCell}`);
        }
        if (result.data?.spreadsheetId) {
            console.log(`📝 Data 내 SpreadsheetId: ${result.data.spreadsheetId}`);
        }
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        console.log('==================== Orchestrator Chat API 응답 데이터 끝 ====================');
        
        // === 응답에서 sheetId가 있으면 상태관리에 저장 ===
        // 여러 위치에서 spreadsheetId 확인: data.id, 최상위 sheetId, data.spreadsheetId 순서
        const extractedSheetId = result.data?.id || result.sheetId || result.data?.spreadsheetId;
        
        if (result.success && extractedSheetId) {
            try {
                if (typeof window !== 'undefined') {
                    const { useUnifiedStore } = require('@/stores');
                    const { setCurrentSheetId } = useUnifiedStore.getState();
                    setCurrentSheetId(extractedSheetId);
                    console.log(`📝 Orchestrator API - SheetId가 상태관리에 저장되었습니다: ${extractedSheetId}`);
                    const source = result.data?.id ? 'data.id' : result.sheetId ? '최상위 sheetId' : 'data.spreadsheetId';
                    console.log(`📍 SheetId 출처: ${source}`);
                }
            } catch (error) {
                console.warn('Orchestrator API - SheetId를 상태관리에 저장하는데 실패했습니다:', error);
                // 실패해도 API 응답은 그대로 반환
            }
        } else if (result.success) {
            console.log('⚠️ Orchestrator API - 응답에서 SheetId를 찾을 수 없습니다');
            console.log('- result.data?.id:', result.data?.id);
            console.log('- result.sheetId:', result.sheetId);
            console.log('- result.data?.spreadsheetId:', result.data?.spreadsheetId);
        }
        
        return result;
        
    } catch (error) {
        console.error('==================== Orchestrator Chat API 호출 오류 ====================');
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('==================== Orchestrator Chat API 오류 끝 ====================');
        throw error;
    }
};

// ======================================
// Auto-Save API 인터페이스 및 함수들
// ======================================

// Auto-Save 요청 DTO
export interface AutoSaveSpreadsheetDto {
    userId: string;
    spreadsheetId: string;
    sheets: Array<{
        name: string;
        index: number;
        data: any[][];
    }>;
    activeSheetIndex?: number;
}

// Auto-Save 상태 DTO
export interface AutoSaveStatusDto {
    userId: string;
    spreadsheetId: string;
}

// Auto-Save 응답 인터페이스
export interface AutoSaveResponse {
    success: boolean;
    message: string;
    data?: {
        queuedAt?: string;
        forcedAt?: string;
    };
}

// Auto-Save 상태 응답 인터페이스
export interface AutoSaveStatusResponse {
    success: boolean;
    message: string;
    data: {
        isQueued: boolean;
        queuedAt: string | null;
        retryCount: number;
        estimatedSaveTime: string | null;
    };
}

// === 자동저장 큐에 추가 (수정) ===
export const queueAutoSave = async (data: AutoSaveSpreadsheetDto): Promise<AutoSaveResponse> => {
    try {
        console.log('==================== Auto Save Queue API 요청 시작 ====================');
        console.log(`사용자 ID: ${data.userId}`);
        console.log(`스프레드시트 ID: ${data.spreadsheetId}`);
        console.log(`시트 수: ${data.sheets.length}`);
        console.log(`활성 시트 인덱스: ${data.activeSheetIndex || 0}`);

        const response = await fetch(`${API_BASE_URL}/spreadsheet/auto-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Auto Save Queue API 오류:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Auto Save Queue API 응답:', result);
        console.log('==================== Auto Save Queue API 완료 ====================');
        
        return result;
    } catch (error) {
        console.error('Auto Save Queue API 호출 오류:', error);
        throw error;
    }
};

// === 자동저장 상태 확인 (수정) ===
export const getAutoSaveStatus = async (userId: string, spreadsheetId: string): Promise<AutoSaveStatusResponse> => {
    try {
        console.log('==================== Auto Save Status API 요청 시작 ====================');
        console.log(`사용자 ID: ${userId}`);
        console.log(`스프레드시트 ID: ${spreadsheetId}`);

        const response = await fetch(`${API_BASE_URL}/spreadsheet/auto-save/status?userId=${userId}&spreadsheetId=${spreadsheetId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Auto Save Status API 오류:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Auto Save Status API 응답:', result);
        console.log('==================== Auto Save Status API 완료 ====================');
        
        return result;
    } catch (error) {
        console.error('Auto Save Status API 호출 오류:', error);
        throw error;
    }
};

// === 강제 자동저장 실행 (수정) ===
export const forceAutoSave = async (userId: string, spreadsheetId: string): Promise<AutoSaveResponse> => {
    try {
        console.log('==================== Force Auto Save API 요청 시작 ====================');
        console.log(`사용자 ID: ${userId}`);
        console.log(`스프레드시트 ID: ${spreadsheetId}`);

        const response = await fetch(`${API_BASE_URL}/spreadsheet/auto-save/force`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, spreadsheetId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Force Auto Save API 오류:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Force Auto Save API 응답:', result);
        console.log('==================== Force Auto Save API 완료 ====================');
        
        return result;
    } catch (error) {
        console.error('Force Auto Save API 호출 오류:', error);
        throw error;
    }
};

// === 스프레드시트 저장 API 호출 (수정) ===
export const saveSpreadsheetData = async (
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
    spreadsheetId?: string; // 반환받는 sheetId
    chatId?: string; // 반환받는 chatId
}> => {
    try {
        // 사용자 ID 결정 (옵션에서 제공되거나 자동 생성)
        let userId: string;
        
        if (options?.userId) {
            userId = options.userId;
        } else {
            userId = getCurrentUserId();
        }

        if (!userId) {
            throw new Error('사용자 ID를 생성할 수 없습니다.');
        }

        // 백엔드 스키마에 맞는 형식으로 데이터 변환
        const requestBody = {
            userId: userId,
            chatId: options?.chatId,
            fileName: parsedData.fileName,
            originalFileName: fileInfo.originalFileName,
            fileSize: fileInfo.fileSize,
            fileType: fileInfo.fileType,
            activeSheetIndex: parsedData.activeSheetIndex || 0,
            sheets: parsedData.sheets.map((sheet: any, index: number) => {
                // 다양한 시트 데이터 형식 지원
                let sheetName: string;
                let rawData: any[][];
                
                if (sheet.sheetName) {
                    // 기존 형식: { sheetName, rawData, ... }
                    sheetName = sheet.sheetName;
                    rawData = sheet.rawData || sheet.data || [];
                } else if (sheet.name) {
                    // 백엔드 형식: { name, data, ... }
                    sheetName = sheet.name;
                    rawData = sheet.data || [];
                } else {
                    // 기본값
                    sheetName = `Sheet${index + 1}`;
                    rawData = sheet.data || sheet.rawData || [];
                }

                return {
                    name: sheetName,
                    index: sheet.index !== undefined ? sheet.index : index,
                    data: rawData,
                };
            })
        };

        console.log('==================== Save Spreadsheet API 요청 시작 ====================');
        console.log(`사용자 ID: ${userId} (${userId.startsWith('guest_') ? '게스트' : '로그인'})`);
        console.log(`파일명: ${parsedData.fileName}`);
        console.log(`시트 수: ${parsedData.sheets.length}`);
        console.log('전체 요청 본문:', JSON.stringify(requestBody, null, 2));

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
        console.log('==================== Save Spreadsheet API 응답 시작 ====================');
        console.log(`성공 여부: ${result.success}`);
        console.log(`스프레드시트 ID: ${result.data?.id || result.data?.spreadsheetId || result.data?.sheetId || result.spreadsheetId || '없음'}`);
        console.log('전체 응답:', JSON.stringify(result, null, 2));
        
        // 응답에서 spreadsheetId를 추출하여 반환 (data.id가 실제 spreadsheetId)
        const spreadsheetId = result.data?.id || result.data?.spreadsheetId || result.data?.sheetId || result.spreadsheetId;
        
        // 상태관리에 sheetId와 chatId 저장 (동적 import로 안전하게)
        if (result.success) {
            try {
                if (typeof window !== 'undefined') {
                    const { useUnifiedStore } = require('@/stores');
                    const { setCurrentSheetId, setCurrentChatId } = useUnifiedStore.getState();
                    
                    // SpreadsheetId 저장
                    if (spreadsheetId) {
                        setCurrentSheetId(spreadsheetId);
                        console.log(`✅ SpreadsheetId가 상태관리에 저장되었습니다: ${spreadsheetId}`);
                    }
                    
                    // ChatId 저장 (응답에서 chatId를 추출)
                    const chatId = result.data?.chatId || result.chatId;
                    if (chatId) {
                        setCurrentChatId(chatId);
                        console.log(`✅ ChatId가 상태관리에 저장되었습니다: ${chatId}`);
                    } else {
                        console.log('⚠️ Save API - 응답에서 ChatId를 찾을 수 없습니다');
                        console.log('- result.data?.chatId:', result.data?.chatId);
                        console.log('- result.chatId:', result.chatId);
                    }
                }
            } catch (error) {
                console.warn('상태관리 저장 중 오류 발생:', error);
                // 실패해도 API 응답은 그대로 반환
            }
        } else {
            console.log('⚠️ Save API - 응답에서 SpreadsheetId를 찾을 수 없습니다');
            console.log('- result.data?.id:', result.data?.id);
            console.log('- result.data?.spreadsheetId:', result.data?.spreadsheetId);
            console.log('- result.data?.sheetId:', result.data?.sheetId);
            console.log('- result.spreadsheetId:', result.spreadsheetId);
        }
        
        console.log('==================== Save Spreadsheet API 완료 ====================');
        
        // chatId도 반환값에 포함
        const chatId = result.data?.chatId || result.chatId;
        
        return {
            ...result,
            spreadsheetId: spreadsheetId,
            chatId: chatId
        };
        
    } catch (error) {
        console.error('Save Spreadsheet API Call Error:', error);
        throw error;
    }
};

// === 델타 자동저장 API 추가 ===

// 델타 자동저장 DTO 인터페이스
export interface DeltaAutoSaveDto {
    userId: string;
    spreadsheetId: string;
    cellChanges?: Array<{
        sheetIndex: number;
        row: number;
        col: number;
        value: any;
        oldValue?: any;
    }>;
    metaChanges?: Array<{
        sheetIndex: number;
        name?: string;
        activeSheetIndex?: number;
    }>;
    newSheets?: any[];
    deletedSheets?: number[];
}

// 델타 자동저장 응답 인터페이스
export interface DeltaAutoSaveResponse {
    success: boolean;
    message: string;
    data: {
        queuedAt?: string;
        changesBreakdown?: {
            cellChanges: number;
            metaChanges: number;
            newSheets: number;
            deletedSheets: number;
        };
    };
}

// === 델타 자동저장 큐에 추가 ===
export const queueDeltaAutoSave = async (
    deltaData: Omit<DeltaAutoSaveDto, 'userId'>,
    userId?: string
): Promise<DeltaAutoSaveResponse> => {
    try {
        // 사용자 ID 결정
        const finalUserId = userId || getCurrentUserId();
        
        if (!finalUserId) {
            throw new Error('사용자 ID를 생성할 수 없습니다.');
        }

        const requestBody: DeltaAutoSaveDto = {
            ...deltaData,
            userId: finalUserId
        };

        const totalChanges = (deltaData.cellChanges?.length ?? 0) + 
                           (deltaData.metaChanges?.length ?? 0) + 
                           (deltaData.newSheets?.length ?? 0) + 
                           (deltaData.deletedSheets?.length ?? 0);

        console.log('==================== Delta Auto Save API 요청 시작 ====================');
        console.log(`사용자 ID: ${finalUserId} (${finalUserId.startsWith('guest_') ? '게스트' : '로그인'})`);
        console.log(`스프레드시트 ID: ${deltaData.spreadsheetId}`);
        console.log(`총 변경사항: ${totalChanges}개`);
        console.log(`- 셀 변경: ${deltaData.cellChanges?.length ?? 0}개`);
        console.log(`- 메타 변경: ${deltaData.metaChanges?.length ?? 0}개`);
        console.log(`- 새 시트: ${deltaData.newSheets?.length ?? 0}개`);
        console.log(`- 삭제된 시트: ${deltaData.deletedSheets?.length ?? 0}개`);

        const response = await fetch(`${API_BASE_URL}/spreadsheet/auto-save/delta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delta Auto Save API 오류:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API 오류: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Delta Auto Save API 응답:', result);
        console.log('==================== Delta Auto Save API 완료 ====================');
        
        return result;
    } catch (error) {
        console.error('Delta Auto Save API 호출 오류:', error);
        throw error;
    }
};

// === 유틸리티 함수: 게스트 사용자 정리 ===
// 로컬 스토리지의 게스트 사용자 데이터 정리 (선택적)
export const clearGuestUserData = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('guest_user_id');
        console.log('게스트 사용자 데이터가 정리되었습니다.');
    }
};

// 현재 사용자가 게스트인지 확인
export const isGuestUser = (userId?: string): boolean => {
    const id = userId || getCurrentUserId();
    return id.startsWith('guest_') || id.startsWith('temp_');
};