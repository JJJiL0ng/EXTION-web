// useMainChat.ts - React 커스텀 훅
// MainChatApi를 React 컴포넌트에서 쉽게 사용할 수 있도록 하는 훅

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MainChatApi, 
  ChatRequest, 
  ChatEventHandlers, 
  ChatStatus, 
  createChatRequest,
  createDefaultHandlers,
  ChatApiConfig
} from '../../_Api/chat/mainChatApi';

// ==================== 타입 정의 ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  metadata?: any;
}

export interface UseChatOptions {
  config?: Partial<ChatApiConfig>;
  autoConnect?: boolean;
  persistMessages?: boolean;
  maxMessages?: number;
}

export interface UseChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  currentChatId: string | null;
}

export interface UseChatActions {
  sendMessage: (message: string, options?: { spreadsheetId?: string }) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  retryLastMessage: () => Promise<void>;
  stopTyping: () => void;
  disconnect: () => void;
}

export interface UseChatReturn extends UseChatState, UseChatActions {
  // 추가 유틸리티
  getLastUserMessage: () => ChatMessage | null;
  getLastAssistantMessage: () => ChatMessage | null;
  setTypingSpeed: (speed: number) => void;
}

// ==================== 커스텀 훅 ====================

export function useMainChat(
  userId: string,
  options: UseChatOptions = {}
): UseChatReturn {
  
  // ==================== 상태 관리 ====================
  
  const [state, setState] = useState<UseChatState>({
    messages: [],
    status: ChatStatus.IDLE,
    isLoading: false,
    isTyping: false,
    error: null,
    currentChatId: null
  });

  // ==================== Refs ====================
  
  const apiRef = useRef<MainChatApi | null>(null);
  const lastRequestRef = useRef<ChatRequest | null>(null);
  const messageIdCounterRef = useRef(0);

  // ==================== API 인스턴스 초기화 ====================
  
  useEffect(() => {
    apiRef.current = new MainChatApi(options.config);
    
    return () => {
      apiRef.current?.destroy();
    };
  }, []);

  // ==================== 메시지 ID 생성 ====================
  
  const generateMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return `msg_${Date.now()}_${messageIdCounterRef.current}`;
  }, []);

  // ==================== 상태 업데이트 헬퍼 ====================
  
  const updateState = useCallback((updates: Partial<UseChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => {
      const newMessages = [...prev.messages, message];
      
      // 최대 메시지 수 제한
      if (options.maxMessages && newMessages.length > options.maxMessages) {
        return {
          ...prev,
          messages: newMessages.slice(-options.maxMessages)
        };
      }
      
      return {
        ...prev,
        messages: newMessages
      };
    });
  }, [options.maxMessages]);

  const updateLastAssistantMessage = useCallback((content: string, isTyping: boolean) => {
    setState(prev => {
      const messages = [...prev.messages];
      const lastMessageIndex = messages.length - 1;
      
      if (lastMessageIndex >= 0 && messages[lastMessageIndex].role === 'assistant') {
        messages[lastMessageIndex] = {
          ...messages[lastMessageIndex],
          content,
          isTyping
        };
      }
      
      return {
        ...prev,
        messages,
        isTyping
      };
    });
  }, []);

  // ==================== 이벤트 핸들러 ====================
  
  const createEventHandlers = useCallback((): ChatEventHandlers => ({
    onChatStarted: (data) => {
      updateState({ 
        currentChatId: data.chatId,
        status: ChatStatus.PROCESSING,
        isLoading: true 
      });
    },

    onAIProcessingStarted: (data) => {
      updateState({ status: ChatStatus.PROCESSING });
    },

    onAIUpdate: (data) => {
      // AI 처리 진행 상황을 로그로만 출력 (필요시 UI에 표시 가능)
      console.debug('AI Update:', data);
    },

    onChatResponse: (data) => {
      // 어시스턴트 메시지 추가 (타이핑 효과용 빈 메시지)
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        timestamp: data.timestamp,
        isTyping: true,
        metadata: { ...data }
      };
      
      addMessage(assistantMessage);
      updateState({ status: ChatStatus.TYPING });
    },

    onChatCompleted: (data) => {
      updateState({ 
        status: ChatStatus.COMPLETED,
        isLoading: false,
        isTyping: false
      });
    },

    onError: (data) => {
      updateState({ 
        status: ChatStatus.ERROR,
        isLoading: false,
        isTyping: false,
        error: `${data.error}${data.details ? ': ' + data.details : ''}`
      });
    },

    onTypingEffect: (currentText, isComplete) => {
      updateLastAssistantMessage(currentText, !isComplete);
      
      if (isComplete) {
        updateState({ isTyping: false });
      }
    },

    onStatusChange: (status) => {
      updateState({ status });
    }
  }), [updateState, addMessage, updateLastAssistantMessage, generateMessageId]);

  // ==================== 액션 함수들 ====================
  
  const sendMessage = useCallback(async (
    message: string, 
    options: { spreadsheetId?: string } = {}
  ) => {
    if (!apiRef.current || !message.trim()) {
      return;
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    addMessage(userMessage);

    // 채팅 요청 생성
    const request = createChatRequest(message.trim(), userId, {
      chatId: state.currentChatId || undefined,
      spreadsheetId: options.spreadsheetId
    });
    
    lastRequestRef.current = request;

    // 상태 초기화
    updateState({ 
      error: null, 
      isLoading: true,
      status: ChatStatus.CONNECTING
    });

    try {
      await apiRef.current.streamChat(request, createEventHandlers());
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false,
        status: ChatStatus.ERROR
      });
    }
  }, [userId, state.currentChatId, addMessage, updateState, generateMessageId, createEventHandlers]);

  const clearMessages = useCallback(() => {
    updateState({ 
      messages: [],
      currentChatId: null,
      error: null,
      status: ChatStatus.IDLE,
      isLoading: false,
      isTyping: false
    });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const retryLastMessage = useCallback(async () => {
    if (!lastRequestRef.current) {
      return;
    }

    const lastUserMessage = state.messages
      .filter(msg => msg.role === 'user')
      .pop();

    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content, {
        spreadsheetId: lastRequestRef.current.spreadsheetId
      });
    }
  }, [state.messages, sendMessage]);

  const stopTyping = useCallback(() => {
    apiRef.current?.stopTyping();
    updateState({ isTyping: false });
  }, [updateState]);

  const disconnect = useCallback(() => {
    apiRef.current?.abort();
    updateState({ 
      status: ChatStatus.IDLE,
      isLoading: false,
      isTyping: false
    });
  }, [updateState]);

  // ==================== 유틸리티 함수들 ====================
  
  const getLastUserMessage = useCallback((): ChatMessage | null => {
    return state.messages
      .filter(msg => msg.role === 'user')
      .pop() || null;
  }, [state.messages]);

  const getLastAssistantMessage = useCallback((): ChatMessage | null => {
    return state.messages
      .filter(msg => msg.role === 'assistant')
      .pop() || null;
  }, [state.messages]);

  const setTypingSpeed = useCallback((speed: number) => {
    if (apiRef.current) {
      // @ts-ignore - private 속성 접근
      apiRef.current.config.typing.speed = Math.max(10, Math.min(200, speed));
    }
  }, []);

  // ==================== 자동 연결 (선택사항) ====================
  
  useEffect(() => {
    if (options.autoConnect && userId) {
      // 자동 연결 로직이 필요한 경우 여기에 구현
    }
  }, [options.autoConnect, userId]);

  // ==================== 반환값 ====================
  
  return {
    // 상태
    messages: state.messages,
    status: state.status,
    isLoading: state.isLoading,
    isTyping: state.isTyping,
    error: state.error,
    currentChatId: state.currentChatId,
    
    // 액션
    sendMessage,
    clearMessages,
    clearError,
    retryLastMessage,
    stopTyping,
    disconnect,
    
    // 유틸리티
    getLastUserMessage,
    getLastAssistantMessage,
    setTypingSpeed
  };
}

// ==================== 추가 유틸리티 훅들 ====================

/**
 * 채팅 기록을 관리하는 훅
 */
export function useChatHistory(userId: string) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiRef = useRef<MainChatApi>(new MainChatApi());

  const loadChatHistory = useCallback(async (chatId: string, limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRef.current.getChatHistory({
        chatId,
        userId,
        limit,
        offset
      });
      
      setHistory(result.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    history,
    loading,
    error,
    loadChatHistory
  };
}

/**
 * 사용자 채팅 목록을 관리하는 훅
 */
export function useUserChats(userId: string) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiRef = useRef<MainChatApi>(new MainChatApi());

  const loadUserChats = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRef.current.getUserChats({
        userId,
        limit,
        offset
      });
      
      setChats(result.chats || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user chats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    chats,
    loading,
    error,
    loadUserChats
  };
}

export default useMainChat;