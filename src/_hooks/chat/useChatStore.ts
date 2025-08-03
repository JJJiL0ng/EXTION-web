// src/_hooks/chat/useChatStore.ts
// v2 채팅 스토어와 기존 useMainChat 훅을 연결하는 어댑터

import { useCallback, useEffect, useMemo } from 'react'
import { useChatStore } from '../../_store/chat/chatStore'
import { 
  ChatInitMode, 
  ChatInitParams, 
  MessageType, 
  MessageStatus,
  ChatMessage as V2ChatMessage 
} from '../../_types/chat.types'

// 기존 useMainChat 호환성을 위한 타입들
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isTyping?: boolean
  metadata?: any
}

export interface UseChatOptions {
  initMode?: ChatInitMode
  spreadSheetId?: string
  fileInfo?: any
  autoConnect?: boolean
  persistMessages?: boolean
  maxMessages?: number
}

export interface UseChatState {
  messages: ChatMessage[]
  status: 'idle' | 'connecting' | 'processing' | 'typing' | 'completed' | 'error'
  isLoading: boolean
  isTyping: boolean
  error: string | null
  currentChatId: string | null
}

export interface UseChatActions {
  sendMessage: (message: string, options?: { spreadsheetId?: string }) => Promise<void>
  clearMessages: () => void
  clearError: () => void
  retryLastMessage: () => Promise<void>
  stopTyping: () => void
  disconnect: () => void
}

export interface UseChatReturn extends UseChatState, UseChatActions {
  getLastUserMessage: () => ChatMessage | null
  getLastAssistantMessage: () => ChatMessage | null
  setTypingSpeed: (speed: number) => void
}

// =============================================================================
// 타입 변환 유틸리티
// =============================================================================

/**
 * v2 메시지를 v1 메시지 형식으로 변환
 */
const convertV2MessageToV1 = (message: V2ChatMessage): ChatMessage => {
  return {
    id: message.id,
    role: message.type === MessageType.USER ? 'user' : 'assistant',
    content: message.content,
    timestamp: message.timestamp,
    isTyping: message.status === MessageStatus.STREAMING,
    metadata: message.type === MessageType.ASSISTANT ? 
      (message as any).structuredContent : undefined
  }
}

/**
 * v2 상태를 v1 상태 형식으로 변환
 */
const convertV2StateToV1 = (v2State: any): Partial<UseChatState> => {
  const statusMapping = {
    'pending': 'connecting',
    'streaming': 'typing',
    'completed': 'completed',
    'error': 'error'
  } as const

  return {
    messages: v2State.messages.map(convertV2MessageToV1),
    status: v2State.isLoading ? 'processing' : 
            v2State.isStreaming ? 'typing' :
            v2State.error ? 'error' : 'idle',
    isLoading: v2State.isLoading,
    isTyping: v2State.isStreaming,
    error: v2State.error?.message || null,
    currentChatId: v2State.currentSessionId
  }
}

// =============================================================================
// 메인 훅 (기존 useMainChat과 호환)
// =============================================================================

export function useMainChat(
  userId: string,
  options: UseChatOptions = {}
): UseChatReturn {
  
  // v2 스토어 액세스
  const store = useChatStore()
  
  // v2 스토어 상태를 v1 형식으로 변환
  const state = useMemo(() => {
    return convertV2StateToV1(store)
  }, [
    store.messages,
    store.isLoading,
    store.isStreaming,
    store.error,
    store.currentSessionId
  ])

  // =============================================================================
  // 초기화
  // =============================================================================

  useEffect(() => {
    if (!store.isInitialized && userId) {
      const initParams: ChatInitParams = {
        mode: options.initMode || ChatInitMode.EXISTING_CHAT,
        spreadSheetId: options.spreadSheetId,
        fileInfo: options.fileInfo
      }
      
      store.initialize(initParams).catch(console.error)
    }
  }, [userId, options.initMode, options.spreadSheetId, options.fileInfo, store])

  // =============================================================================
  // 액션 구현
  // =============================================================================

  const sendMessage = useCallback(async (
    message: string,
    options: { spreadsheetId?: string } = {}
  ) => {
    try {
      await store.sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [store])

  const clearMessages = useCallback(() => {
    store.reset()
  }, [store])

  const clearError = useCallback(() => {
    store.clearError()
  }, [store])

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = state.messages
      ?.filter(msg => msg.role === 'user')
      .pop()

    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content)
    }
  }, [state.messages, sendMessage])

  const stopTyping = useCallback(() => {
    // v2 스토어에서는 스트리밍 중단이 자동으로 처리됨
    console.log('Stop typing requested')
  }, [])

  const disconnect = useCallback(() => {
    // v2 스토어에서는 연결 해제가 자동으로 처리됨
    console.log('Disconnect requested')
  }, [])

  // =============================================================================
  // 유틸리티 함수
  // =============================================================================

  const getLastUserMessage = useCallback((): ChatMessage | null => {
    return state.messages
      ?.filter(msg => msg.role === 'user')
      .pop() || null
  }, [state.messages])

  const getLastAssistantMessage = useCallback((): ChatMessage | null => {
    return state.messages
      ?.filter(msg => msg.role === 'assistant')
      .pop() || null
  }, [state.messages])

  const setTypingSpeed = useCallback((speed: number) => {
    console.log('Typing speed change requested:', speed)
    // v2에서는 스트리밍 속도가 백엔드에서 제어됨
  }, [])

  // =============================================================================
  // 반환값
  // =============================================================================

  return {
    // 상태
    messages: state.messages || [],
    status: state.status || 'idle',
    isLoading: state.isLoading || false,
    isTyping: state.isTyping || false,
    error: state.error || null,
    currentChatId: state.currentChatId || null,
    
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
  }
}

// =============================================================================
// 추가 훅들 (v2 스토어 기반)
// =============================================================================

/**
 * 채팅 플로우 전용 훅
 */
export function useChatFlow(initParams: ChatInitParams) {
  const store = useChatStore()
  
  useEffect(() => {
    if (!store.isInitialized) {
      store.initialize(initParams)
    }
  }, [initParams.mode, initParams.spreadSheetId])
  
  return {
    isInitialized: store.isInitialized,
    canSendMessage: store.getCanSendMessage(),
    availableActions: store.getAvailableActions(),
    
    // 초기화 모드별 액션
    createNewChat: (title?: string) => store.createSession({
      title,
      initMode: initParams.mode,
      spreadSheetId: initParams.spreadSheetId,
      fileInfo: initParams.fileInfo
    }),
    
    switchChat: store.switchSession,
    deleteChat: store.deleteSession
  }
}

/**
 * 채팅 세션 관리 훅
 */
export function useChatSessions() {
  const store = useChatStore()
  
  useEffect(() => {
    if (store.isInitialized && store.sessions.length === 0) {
      store.loadSessions()
    }
  }, [store.isInitialized])
  
  return {
    sessions: store.sessions,
    currentSession: store.getCurrentSession(),
    isLoading: store.isLoading,
    error: store.error,
    
    // 세션 관리 액션
    loadSessions: store.loadSessions,
    createSession: store.createSession,
    switchSession: store.switchSession,
    deleteSession: store.deleteSession
  }
}

/**
 * 스트리밍 상태 전용 훅
 */
export function useChatStreaming() {
  const store = useChatStore()
  
  const currentStreamingMessage = useMemo(() => {
    return store.messages.find(msg => 
      msg.type === MessageType.ASSISTANT && 
      msg.status === MessageStatus.STREAMING
    )
  }, [store.messages])
  
  return {
    isStreaming: store.isStreaming,
    streamingMessage: currentStreamingMessage,
    streamingContent: currentStreamingMessage?.content || '',
    
    // 스트리밍 제어
    handleStreamEvent: store.handleStreamEvent
  }
}

// =============================================================================
// 레거시 지원 (기존 코드와의 호환성)
// =============================================================================

/**
 * 기존 useChatHistory 훅 호환 버전
 */
export function useChatHistory(userId: string) {
  const store = useChatStore()
  
  const loadChatHistory = useCallback(async (
    chatId: string, 
    limit = 50, 
    offset = 0
  ) => {
    try {
      await store.loadMessages(chatId)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [store])
  
  return {
    history: store.messages.map(convertV2MessageToV1),
    loading: store.isLoading,
    error: store.error?.message || null,
    loadChatHistory
  }
}

/**
 * 기존 useUserChats 훅 호환 버전
 */
export function useUserChats(userId: string) {
  const store = useChatStore()
  
  const loadUserChats = useCallback(async (limit = 20, offset = 0) => {
    try {
      await store.loadSessions()
    } catch (error) {
      console.error('Failed to load user chats:', error)
    }
  }, [store])
  
  return {
    chats: store.sessions,
    loading: store.isLoading,
    error: store.error?.message || null,
    loadUserChats
  }
}

// v2 스토어 직접 접근용 (컴포넌트에서 스토어 상태 직접 사용시)
export { useChatStore } from '../../_store/chat/chatStore'

// 기본 내보내기 (기존 코드와의 호환성)
export default useMainChat