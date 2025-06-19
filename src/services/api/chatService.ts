// 백엔드 API 호출을 위한 채팅 서비스

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChatInfo {
  title: string;
  createdAt: Date;
  updatedAt: Date;
  totalMessageCount: number;
  sheetMetaDataId?: string;
}

export interface ChatListItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
  };
  sheetMetaDataId?: string;
  spreadsheetData?: {
    fileName: string;
    totalSheets: number;
  };
}

export interface LoadChatResponse {
  success: boolean;
  chatId: string;
  messages: ChatMessage[];
  messageCount: number;
  chatInfo?: ChatInfo;
}

export interface ChatListResponse {
  success: boolean;
  chats: ChatListItem[];
  count: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 채팅 메시지 로드
 */
export const loadChatMessages = async (
  chatId: string, 
  userId: string, 
  limit?: number
): Promise<LoadChatResponse> => {
  try {
    const params = new URLSearchParams({
      userId,
      ...(limit && { limit: limit.toString() })
    });

    const response = await fetch(
      `${API_BASE_URL}/chat-database/load/${chatId}?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: LoadChatResponse = await response.json();
    
    // Date 객체로 변환
    data.messages = data.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));

    if (data.chatInfo) {
      data.chatInfo.createdAt = new Date(data.chatInfo.createdAt);
      data.chatInfo.updatedAt = new Date(data.chatInfo.updatedAt);
    }

    return data;
  } catch (error) {
    console.error('채팅 메시지 로드 실패:', error);
    throw error;
  }
};

/**
 * 사용자의 채팅 목록 조회
 */
export const getChatList = async (userId: string): Promise<ChatListResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chat-database/list?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatListResponse = await response.json();
    
    // Date 객체로 변환
    data.chats = data.chats.map(chat => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
      lastMessage: chat.lastMessage ? {
        ...chat.lastMessage,
        timestamp: new Date(chat.lastMessage.timestamp)
      } : undefined
    }));

    return data;
  } catch (error) {
    console.error('채팅 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * Firebase 호환 타입을 새 API 타입으로 변환
 */
export const convertChatListItemToFirebaseChat = (item: ChatListItem) => {
  return {
    id: item.id,
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    messageCount: item.messageCount,
    lastMessage: item.lastMessage ? {
      content: item.lastMessage.content,
      timestamp: item.lastMessage.timestamp,
      role: 'user' as const,
      type: 'text'
    } : undefined,
    spreadsheetId: item.sheetMetaDataId,
    spreadsheetData: item.spreadsheetData,
    userId: '', // API에서 제공되지 않으므로 빈 문자열
  };
};

/**
 * 새 API 메시지를 기존 포맷으로 변환
 */
export const convertApiMessageToChatMessage = (apiMessage: ChatMessage) => {
  const role = apiMessage.role === 'assistant' ? 'Extion ai' as const : 'user' as const;
  return {
    id: apiMessage.id,
    role: role,
    content: apiMessage.content,
    timestamp: apiMessage.timestamp,
    metadata: apiMessage.metadata,
    type: role, // role과 같은 값으로 설정
  };
};

/**
 * 새 채팅 생성
 */
export const createChat = async (title: string, userId: string, spreadsheetId?: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-database/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        userId,
        spreadsheetId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CreateChatResponseDto = await response.json();
    
    if (!data.success) {
      throw new Error('채팅 생성에 실패했습니다.');
    }

    return data.chatId;
  } catch (error) {
    console.error('새 채팅 생성 실패:', error);
    throw error;
  }
};

/**
 * 채팅 삭제
 */
export const deleteChat = async (chatId: string, userId: string): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chat-database/${chatId}?userId=${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DeleteChatResponseDto = await response.json();
    
    if (!data.success) {
      throw new Error('채팅 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('채팅 삭제 실패:', error);
    throw error;
  }
};

/**
 * 채팅 제목 업데이트
 */
export const updateChatTitle = async (chatId: string, title: string, userId: string): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chat-database/${chatId}/title`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          userId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('채팅 제목 업데이트에 실패했습니다.');
    }
  } catch (error) {
    console.error('채팅 제목 업데이트 실패:', error);
    throw error;
  }
};

// 새로운 DTO 타입들
export interface CreateChatResponseDto {
  success: boolean;
  chatId: string;
  chat?: ChatListItem;
}

export interface DeleteChatResponseDto {
  success: boolean;
  message?: string;
} 