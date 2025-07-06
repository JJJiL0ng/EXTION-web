// 백엔드 Chat and Sheet API 호출을 위한 서비스
import { ChatMessage } from '@/stores/store-types';

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

// 백엔드 Message DTO 타입
export interface MessageDto {
  id: string;
  content: string;
  timestamp: Date;
  role: 'USER' | 'EXTION_AI' | 'SYSTEM';
  type: 'TEXT' | 'FILE_UPLOAD' | 'VISUALIZATION' | 'DATA_GENERATION' | 'FUNCTION' | 'DATA_EDIT';
  mode?: 'NORMAL' | 'VISUALIZATION' | 'DATA_GENERATION' | 'DATA_EDIT' | 'FUNCTION';
  sheetContext?: any;
  formulaData?: any;
  artifactData?: any;
  dataChangeInfo?: any;
  fileUploadInfo?: any;
  metadata?: any;
}

// 백엔드 Chat DTO 타입
export interface ChatDto {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  analytics?: any;
  userId: string;
  messages: MessageDto[];
}

// Chat Sheet Data Response 타입 (업데이트됨)
export interface ChatSheetDataResponseDto {
  chatId: string;
  chat?: ChatDto;
  sheetMetaData?: SheetMetaDataWithTablesDto;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 백엔드 MessageDto를 프론트엔드 ChatMessage로 변환
 */
export const convertMessageDtoToChatMessage = (messageDto: MessageDto): ChatMessage => {
  // role 매핑
  const typeMapping: { [key: string]: 'user' | 'Extion ai' } = {
    'USER': 'user',
    'EXTION_AI': 'Extion ai',
    'SYSTEM': 'Extion ai'
  };

  // mode 매핑
  const modeMapping: { [key: string]: 'normal' | 'formula' | 'artifact' | 'datafix' } = {
    'NORMAL': 'normal',
    'FUNCTION': 'formula',
    'VISUALIZATION': 'artifact',
    'DATA_EDIT': 'datafix',
    'DATA_GENERATION': 'artifact'
  };

  const chatMessage: ChatMessage = {
    id: messageDto.id,
    type: typeMapping[messageDto.role] || 'Extion ai',
    content: messageDto.content,
    timestamp: new Date(messageDto.timestamp),
    mode: messageDto.mode ? modeMapping[messageDto.mode] || 'normal' : 'normal'
  };

  // 백엔드에서 불러온 메시지임을 표시하는 플래그 추가
  (chatMessage as any).isFromBackend = true;

  // artifactData 변환
  if (messageDto.artifactData) {
    chatMessage.artifactData = {
      type: messageDto.artifactData.type || 'analysis',
      title: messageDto.artifactData.title || '분석 결과',
      timestamp: new Date(messageDto.timestamp),
      code: messageDto.artifactData.code,
      artifactId: messageDto.artifactData.artifactId,
      explanation: messageDto.artifactData.explanation
    };
  }

  // dataChangeInfo를 dataFixData로 변환
  if (messageDto.dataChangeInfo && messageDto.type === 'DATA_EDIT') {
    chatMessage.dataFixData = {
      editedData: messageDto.dataChangeInfo.editedData || messageDto.dataChangeInfo,
      sheetIndex: messageDto.dataChangeInfo.sheetIndex,
      changes: messageDto.dataChangeInfo.changes,
      isApplied: false // 기본값으로 false 설정
    };
  }

  // formulaData 처리 (ChatMessage 타입에 없지만 런타임에서 사용)
  if (messageDto.formulaData) {
    (chatMessage as any).formulaData = messageDto.formulaData;
  }

  // functionData 처리 (FUNCTION 타입 메시지용)
  if (messageDto.type === 'FUNCTION' && messageDto.formulaData) {
    (chatMessage as any).functionData = {
      functionDetails: messageDto.formulaData
    };
  }

  return chatMessage;
};

/**
 * 백엔드 ChatDto의 메시지들을 프론트엔드 ChatMessage[]로 변환
 */
export const convertChatMessagesToFrontend = (chatDto: ChatDto): ChatMessage[] => {
  return chatDto.messages.map(convertMessageDtoToChatMessage);
};

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
