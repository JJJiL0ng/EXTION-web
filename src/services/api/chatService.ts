// 백엔드 API 호출을 위한 채팅 서비스

// 기본 채팅 메시지 타입
export interface ChatMessage {
  messageId: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  type: string;
  mode: string;
  timestamp: string;
  sheetContext?: any;
  formulaData?: any;
  artifactData?: any;
  dataChangeInfo?: any;
  fileUploadInfo?: any;
  metadata?: any;
}

// 오케스트레이터 채팅 요청 타입
export interface OrchestratorChatRequest {
  message: string;
  sheetId?: string;
  chatId?: string;
  userId?: string;
  countryCode: string;
  language?: string;
  timezone?: string;
  timestamp: string;
}

// 오케스트레이터 채팅 응답 타입
export interface OrchestratorChatResponse {
  success: boolean;
  chatType: 'general-chat' | 'function-chat' | 'edit-chat' | 'generate-chat' | 'visualization-chat' | null;
  chatId: string;
  sheetId: string;
  userId: string;
  userMessageId: string;
  aiMessageId: string;
  timestamp: string;
  userContext: {
    countryCode: string;
    language: string;
    timezone: string;
  };
  data: any;
  error?: string;
}

// 채팅 정보 타입
export interface ChatInfo {
  title: string;
  createdAt: string;
  updatedAt: string;
  totalMessageCount: number;
  sheetMetaDataId?: string;
}

// 채팅 목록 아이템 타입
export interface ChatListItem {
  chatId: string;
  title: string;
  messageCount: number;
  lastUpdated: string;
  createdAt: string;
  sheetMetaDataId?: string;
  status: string;
}

// 채팅 로드 응답 타입
export interface LoadChatResponse {
  success: boolean;
  chatId: string;
  messages: ChatMessage[];
  messageCount: number;
  chatInfo: ChatInfo;
}

// 채팅 목록 응답 타입
export interface ChatListResponse {
  success: boolean;
  chats: ChatListItem[];
  count: number;
}

// 새 채팅 생성 요청 타입
export interface CreateChatRequest {
  title: string;
  userId: string;
  spreadsheetId?: string;
}

// 새 채팅 생성 응답 타입
export interface CreateChatResponse {
  success: boolean;
  chatId: string;
  chat: ChatListItem;
}

// 채팅 삭제 응답 타입
export interface DeleteChatResponse {
  success: boolean;
  message: string;
}

// 채팅 제목 업데이트 요청 타입
export interface UpdateChatTitleRequest {
  title: string;
  userId: string;
}

// 채팅 제목 업데이트 응답 타입
export interface UpdateChatTitleResponse {
  success: boolean;
  message: string;
  data: {
    chatId: string;
    title: string;
    updatedAt: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 오케스트레이터 채팅 메시지 전송
 */
export const sendOrchestratorMessage = async (request: OrchestratorChatRequest): Promise<OrchestratorChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orchestrator-chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OrchestratorChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('오케스트레이터 메시지 전송 실패:', error);
    throw error;
  }
};

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
    return data;
  } catch (error) {
    console.error('채팅 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 새 채팅 생성
 */
export const createChat = async (request: CreateChatRequest): Promise<CreateChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-database/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CreateChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('새 채팅 생성 실패:', error);
    throw error;
  }
};

/**
 * 채팅 삭제
 */
export const deleteChat = async (chatId: string, userId: string): Promise<DeleteChatResponse> => {
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

    const data: DeleteChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('채팅 삭제 실패:', error);
    throw error;
  }
};

/**
 * 채팅 제목 업데이트
 */
export const updateChatTitle = async (
  chatId: string, 
  request: UpdateChatTitleRequest
): Promise<UpdateChatTitleResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-database/${chatId}/title`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UpdateChatTitleResponse = await response.json();
    return data;
  } catch (error) {
    console.error('채팅 제목 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 사용자 채팅 디버깅 정보 조회
 */
export const getUserChatDebugInfo = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-database/debug/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('사용자 채팅 디버깅 정보 조회 실패:', error);
    throw error;
  }
};

// 레거시 호환성을 위한 변환 함수들
export const convertChatListItemToFirebaseChat = (item: ChatListItem) => {
  return {
    id: item.chatId,
    title: item.title,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.lastUpdated),
    messageCount: item.messageCount,
    spreadsheetId: item.sheetMetaDataId,
    userId: '',
  };
};

export const convertApiMessageToChatMessage = (apiMessage: ChatMessage) => {
  return {
    id: apiMessage.messageId,
    type: (apiMessage.role === 'ASSISTANT' ? 'Extion ai' : 'user') as 'user' | 'Extion ai',
    content: apiMessage.content,
    timestamp: new Date(apiMessage.timestamp),
    metadata: apiMessage.metadata,
    mode: apiMessage.mode as 'normal',
    artifactData: apiMessage.artifactData,
  };
}; 