// 어드민용 채팅 시트 데이터 API 호출 서비스
import { ChatSheetDataResponseDto } from '@/services/api/chatandsheetService';

// 백엔드 API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 어드민 사용자 ID 가져오기
export const getAdminUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('adminUserId');
  }
  return null;
};

// 어드민 로그인 상태 확인
export const isAdminLoggedIn = (): boolean => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  }
  return false;
};

/**
 * 어드민용 API 호출 헬퍼 함수
 */
const adminApiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const adminUserId = getAdminUserId();
  if (!adminUserId) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  // GET 요청인 경우 쿼리 파라미터로 adminUserId 추가
  if (!options.method || options.method === 'GET') {
    url.searchParams.append('adminUserId', adminUserId);
  }

  console.log('🔑 어드민 API 요청:', {
    url: url.toString(),
    method: options.method || 'GET',
    adminUserId,
    endpoint
  });

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    mode: 'cors',
    credentials: 'omit',
  });

  console.log('📡 어드민 API 응답:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  const responseText = await response.text();
  let data;
  
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error('JSON 파싱 오류:', parseError);
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || '요청 처리 중 오류가 발생했습니다.';
    console.error('어드민 API 오류:', {
      status: response.status,
      message: errorMessage,
      data
    });
    throw new Error(errorMessage);
  }

  return data;
};

/**
 * 어드민용 채팅 시트 데이터 로드
 * @param chatId 채팅 ID
 * @returns ChatSheetDataResponseDto
 */
export const loadAdminChatSheetData = async (chatId: string): Promise<ChatSheetDataResponseDto> => {
  try {
    if (!chatId) {
      throw new Error('채팅 ID가 필요합니다.');
    }

    console.log('🔍 어드민 채팅 시트 데이터 로드 시작:', { chatId });

    const data: ChatSheetDataResponseDto = await adminApiCall(`/chatandsheet/admin/load/${chatId}`);
    
    console.log('✅ 어드민 채팅 시트 데이터 로드 완료:', {
      chatId: data.chatId,
      hasChat: !!data.chat,
      hasSheetMetaData: !!data.sheetMetaData,
      sheetsCount: data.sheetMetaData?.sheetTableData?.length || 0,
      userId: data.chat?.userId
    });

    // Date 객체로 변환
    if (data.chat) {
      data.chat.createdAt = new Date(data.chat.createdAt);
      data.chat.updatedAt = new Date(data.chat.updatedAt);
      
      // 메시지들의 timestamp 변환
      if (data.chat.messages) {
        data.chat.messages = data.chat.messages.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }
    }

    if (data.sheetMetaData) {
      data.sheetMetaData.createdAt = new Date(data.sheetMetaData.createdAt);
      data.sheetMetaData.updatedAt = new Date(data.sheetMetaData.updatedAt);
      
      // 시트 테이블 데이터들의 Date 변환
      if (data.sheetMetaData.sheetTableData) {
        data.sheetMetaData.sheetTableData = data.sheetMetaData.sheetTableData.map(sheet => ({
          ...sheet,
          createdAt: new Date(sheet.createdAt),
          updatedAt: new Date(sheet.updatedAt)
        }));
      }
    }
    
    return data;
  } catch (error) {
    console.error('어드민 채팅 시트 데이터 로드 실패:', error);
    throw error;
  }
};

/**
 * 어드민용 채팅 시트 데이터 존재 여부 확인
 * @param chatId 채팅 ID
 * @returns boolean
 */
export const hasAdminChatSheetData = async (chatId: string): Promise<boolean> => {
  try {
    const data = await loadAdminChatSheetData(chatId);
    return !!(data.chat || data.sheetMetaData);
  } catch (error) {
    console.error('어드민 채팅 시트 데이터 존재 여부 확인 실패:', error);
    return false;
  }
};

/**
 * 어드민용 채팅 메시지만 가져오기
 * @param chatId 채팅 ID
 * @returns MessageDto[]
 */
export const getAdminChatMessages = async (chatId: string) => {
  try {
    const data = await loadAdminChatSheetData(chatId);
    return data.chat?.messages || [];
  } catch (error) {
    console.error('어드민 채팅 메시지 조회 실패:', error);
    throw error;
  }
};

/**
 * 어드민용 시트 메타데이터만 가져오기
 * @param chatId 채팅 ID
 * @returns SheetMetaDataWithTablesDto | null
 */
export const getAdminSheetMetaData = async (chatId: string) => {
  try {
    const data = await loadAdminChatSheetData(chatId);
    return data.sheetMetaData || null;
  } catch (error) {
    console.error('어드민 시트 메타데이터 조회 실패:', error);
    throw error;
  }
};

/**
 * 어드민용 시트 테이블 데이터 가져오기
 * @param chatId 채팅 ID
 * @returns SheetTableDataDto[]
 */
export const getAdminSheetTableData = async (chatId: string) => {
  try {
    const data = await loadAdminChatSheetData(chatId);
    return data.sheetMetaData?.sheetTableData || [];
  } catch (error) {
    console.error('어드민 시트 테이블 데이터 조회 실패:', error);
    throw error;
  }
};

/**
 * 어드민용 특정 인덱스의 시트 데이터 가져오기
 * @param chatId 채팅 ID
 * @param sheetIndex 시트 인덱스
 * @returns SheetTableDataDto | null
 */
export const getAdminSheetDataByIndex = async (chatId: string, sheetIndex: number) => {
  try {
    const sheetTableData = await getAdminSheetTableData(chatId);
    return sheetTableData.find(sheet => sheet.index === sheetIndex) || null;
  } catch (error) {
    console.error('어드민 시트 데이터 조회 실패:', error);
    throw error;
  }
};

/**
 * 어드민용 활성 시트 데이터 가져오기
 * @param chatId 채팅 ID
 * @returns SheetTableDataDto | null
 */
export const getAdminActiveSheetData = async (chatId: string) => {
  try {
    const data = await loadAdminChatSheetData(chatId);
    if (!data.sheetMetaData) return null;
    
    const activeSheetIndex = data.sheetMetaData.activeSheetIndex;
    return data.sheetMetaData.sheetTableData.find(sheet => sheet.index === activeSheetIndex) || null;
  } catch (error) {
    console.error('어드민 활성 시트 데이터 조회 실패:', error);
    throw error;
  }
};
