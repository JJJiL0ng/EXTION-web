// 백엔드 Chat and Sheet API 호출을 위한 서비스

// Sheet Table Data 타입
export interface SheetTableDataDto {
  id: string;
  name: string;
  index: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

// Sheet Meta Data with Tables 타입
export interface SheetMetaDataWithTablesDto {
  id: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  sheetTableData: SheetTableDataDto[];
}

// Chat Sheet Data Response 타입
export interface ChatSheetDataResponseDto {
  chatId: string;
  sheetMetaData?: SheetMetaDataWithTablesDto;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// 개발 환경에서는 Next.js 프록시 사용 (CORS 문제 해결)
const getApiUrl = (endpoint: string) => {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경: Next.js 프록시 사용
    return `/api/chatandsheet/${endpoint}`;
  } else {
    // 프로덕션 환경: 직접 API 서버 호출
    return `${API_BASE_URL}/chatandsheet/${endpoint}`;
  }
};

/**
 * 채팅 ID로 Chat과 Sheet 데이터를 함께 로드
 */
export const loadChatSheetData = async (chatId: string): Promise<ChatSheetDataResponseDto> => {
  try {
    const apiUrl = getApiUrl(`load/${chatId}`);
    console.log('🌐 API 요청 시작:', {
      chatId,
      apiUrl,
      API_BASE_URL,
      environment: process.env.NODE_ENV,
      usingProxy: process.env.NODE_ENV === 'development'
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // CORS 명시적 설정
      credentials: 'omit', // 쿠키 전송 안함
    });

    console.log('📡 API 응답 받음:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Chat with id ${chatId} not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatSheetDataResponseDto = await response.json();
    
    console.log('✅ API 데이터 파싱 완료:', {
      chatId: data.chatId,
      hasSheetMetaData: !!data.sheetMetaData,
      sheetsCount: data.sheetMetaData?.sheetTableData?.length || 0
    });
    
    // Date 객체로 변환
    if (data.sheetMetaData) {
      data.sheetMetaData.createdAt = new Date(data.sheetMetaData.createdAt);
      data.sheetMetaData.updatedAt = new Date(data.sheetMetaData.updatedAt);
      
      // sheetTableData의 Date도 변환
      data.sheetMetaData.sheetTableData = data.sheetMetaData.sheetTableData.map(table => ({
        ...table,
        createdAt: new Date(table.createdAt),
        updatedAt: new Date(table.updatedAt),
      }));
    }

    return data;
  } catch (error) {
    console.error('❌ Chat과 Sheet 데이터 로드 실패:', {
      chatId,
      error: error instanceof Error ? error.message : error,
      API_BASE_URL,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * 채팅 ID로 Sheet 데이터가 있는지 확인
 */
export const hasSheetData = async (chatId: string): Promise<boolean> => {
  try {
    const data = await loadChatSheetData(chatId);
    return data.sheetMetaData !== undefined;
  } catch (error) {
    console.error('Sheet 데이터 존재 여부 확인 실패:', error);
    return false;
  }
};

/**
 * 채팅 ID로 Sheet Table Data만 추출
 */
export const getSheetTableData = async (chatId: string): Promise<SheetTableDataDto[]> => {
  try {
    const data = await loadChatSheetData(chatId);
    return data.sheetMetaData?.sheetTableData || [];
  } catch (error) {
    console.error('Sheet Table 데이터 추출 실패:', error);
    throw error;
  }
};

/**
 * 채팅 ID로 특정 시트 인덱스의 데이터 가져오기
 */
export const getSheetDataByIndex = async (chatId: string, sheetIndex: number): Promise<SheetTableDataDto | null> => {
  try {
    const tableDataList = await getSheetTableData(chatId);
    return tableDataList.find(sheet => sheet.index === sheetIndex) || null;
  } catch (error) {
    console.error('특정 시트 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 채팅 ID로 활성화된 시트 데이터 가져오기
 */
export const getActiveSheetData = async (chatId: string): Promise<SheetTableDataDto | null> => {
  try {
    const data = await loadChatSheetData(chatId);
    if (!data.sheetMetaData) {
      return null;
    }
    
    const activeIndex = data.sheetMetaData.activeSheetIndex;
    return data.sheetMetaData.sheetTableData.find(sheet => sheet.index === activeIndex) || null;
  } catch (error) {
    console.error('활성화된 시트 데이터 가져오기 실패:', error);
    throw error;
  }
};
