// src/_hooks/chat/useChatStore.ts
// V2 채팅 시스템 전용 훅들

import { useCallback, useEffect, useMemo } from 'react'
import { useChatStore } from '../../_store/chat/chatStore'
import { 
  ChatInitMode, 
  ChatInitParams, 
  MessageType, 
  MessageStatus
} from '../../_types/chat.types'

// =============================================================================
// V2 채팅 시스템 메인 훅 (ChatInputBox용)
// =============================================================================

/**
 * 간단한 채팅 인터페이스 훅 (ChatInputBox 등에서 사용)
 */
export function useMainChat(userId: string) {
  const store = useChatStore()

  // 초기화
  useEffect(() => {
    if (!store.isInitialized && userId) {
      const initParams: ChatInitParams = {
        mode: ChatInitMode.EXISTING_CHAT
      }
      store.initialize(initParams).catch(console.error)
    }
  }, [userId, store])

  const sendMessage = useCallback(async (content: string) => {
    try {
      await store.sendMessage(content)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [store])

  return {
    sendMessage,
    isLoading: store.isLoading
  }
}

/**
 * 채팅 플로우 전용 훅 (파일 업로드, 세션 관리 등)
 */
export function useChatFlow(initParams: ChatInitParams) {
  const store = useChatStore()
  
  useEffect(() => {
    if (!store.isInitialized) {
      store.initialize(initParams)
    }
  }, [initParams, store])
  
  return {
    isInitialized: store.isInitialized,
    canSendMessage: store.getCanSendMessage(),
    availableActions: store.getAvailableActions(),
    
    // 세션 관리 액션
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
 * 채팅 세션 관리 전용 훅
 */
export function useChatSessions() {
  const store = useChatStore()
  
  useEffect(() => {
    if (store.isInitialized && store.sessions.length === 0) {
      store.loadSessions()
    }
  }, [store])
  
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

// V2 스토어 직접 접근 (고급 사용자용)
export { useChatStore } from '../../_store/chat/chatStore'

// 기본 내보내기
export default useMainChat