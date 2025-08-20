// src/_store/chat/chatActions.ts
// 채팅 스토어 액션 헬퍼 함수들

import {
  ChatInitMode,
  ChatInitParams,
  CreateChatRequest,
  SendMessageRequest,
  ChatError,
  ChatMessage,
  MessageType,
  MessageStatus,
  StreamEvent,
  StreamEventType
} from '../../_types/chat.types'

import { STORE_CONSTANTS } from './chatTypes'
import { CHAT_CONSTANTS } from '../../_types/chat.types'

// =============================================================================
// 액션 헬퍼 함수들
// =============================================================================

/**
 * 채팅 초기화 파라미터 검증
 */
export const validateInitParams = (params: ChatInitParams): void => {
  if (!params.mode) {
    throw new Error('Init mode is required')
  }

  if (params.mode === ChatInitMode.FILE_UPLOAD && !params.fileInfo) {
    throw new Error('File info is required for FILE_UPLOAD mode')
  }

  if (params.mode === ChatInitMode.EXISTING_CHAT && !params.existingChatId && !params.spreadSheetId) {
    console.warn('No existing chat ID or spreadsheet ID provided for EXISTING_CHAT mode')
  }
}

/**
 * 채팅 생성 요청 검증
 */
export const validateCreateChatRequest = (request: CreateChatRequest): void => {
  if (!request.initMode) {
    throw new Error('Init mode is required for chat creation')
  }

  if (request.initMode === ChatInitMode.FILE_UPLOAD && !request.fileInfo) {
    throw new Error('File info is required when init mode is FILE_UPLOAD')
  }
}

/**
 * 메시지 전송 요청 검증
 */
export const validateSendMessageRequest = (content: string): void => {
  if (!content || content.trim().length === 0) {
    throw new Error('Message content cannot be empty')
  }

  if (content.length > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH) {
    throw new Error(`Message too long. Maximum ${CHAT_CONSTANTS.MAX_MESSAGE_LENGTH} characters allowed`)
  }
}

/**
 * 오류 복구 전략 결정
 */
export const determineRecoveryStrategy = (error: ChatError): 'retry' | 'reset' | 'manual' => {
  if (!error.recoverable) {
    return 'manual'
  }

  switch (error.code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT_ERROR':
      return 'retry'
    
    case 'INIT_ERROR':
    case 'CREATE_SESSION_ERROR':
      return 'reset'
    
    default:
      return 'manual'
  }
}

// =============================================================================
// 스트리밍 관련 헬퍼들
// =============================================================================

/**
 * SSE 연결 관리 클래스
 */
export class StreamingManager {
  private eventSource: EventSource | null = null
  private messageId: string | null = null
  private onEvent: ((event: StreamEvent) => void) | null = null

  /**
   * 스트리밍 시작
   */
  startStreaming(
    streamUrl: string, 
    messageId: string, 
    onEvent: (event: StreamEvent) => void
  ): void {
    this.cleanup()
    
    this.messageId = messageId
    this.onEvent = onEvent
    
    try {
      this.eventSource = new EventSource(streamUrl)
      
      this.eventSource.onopen = () => {
        this.onEvent?.({
          type: StreamEventType.START,
          messageId: this.messageId!
        })
      }
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.onEvent?.({
            type: StreamEventType.DATA,
            data: data.content,
            messageId: this.messageId!
          })
        } catch (error) {
          console.error('Failed to parse streaming data:', error)
        }
      }
      
      this.eventSource.onerror = (error) => {
        this.onEvent?.({
          type: StreamEventType.ERROR,
          error: {
            code: 'STREAM_ERROR',
            message: 'Streaming connection failed',
            timestamp: new Date().toISOString(),
            recoverable: true
          },
          messageId: this.messageId!
        })
        this.cleanup()
      }
      
      // 타임아웃 설정
      setTimeout(() => {
        if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
          this.onEvent?.({
            type: StreamEventType.END,
            messageId: this.messageId!
          })
          this.cleanup()
        }
      }, STORE_CONSTANTS.STREAM_TIMEOUT)
      
    } catch (error) {
      this.onEvent?.({
        type: StreamEventType.ERROR,
        error: {
          code: 'STREAM_INIT_ERROR',
          message: 'Failed to initialize streaming',
          timestamp: new Date().toISOString(),
          recoverable: true
        },
        messageId: this.messageId!
      })
    }
  }

  /**
   * 스트리밍 정리
   */
  cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.messageId = null
    this.onEvent = null
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}

// =============================================================================
// 재시도 로직
// =============================================================================

/**
 * 지수 백오프를 사용한 재시도 함수
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = STORE_CONSTANTS.MAX_RETRIES,
  baseDelay: number = STORE_CONSTANTS.RETRY_DELAY
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        break
      }
      
      // 지수 백오프 지연
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// =============================================================================
// 메시지 유틸리티
// =============================================================================

/**
 * 메시지 타입별 스타일링 클래스 반환
 */
export const getMessageStyleClass = (message: ChatMessage): string => {
  const baseClass = 'message'
  
  switch (message.type) {
    case MessageType.USER:
      return `${baseClass} ${baseClass}--user`
    case MessageType.ASSISTANT:
      return `${baseClass} ${baseClass}--assistant ${
        message.status === MessageStatus.STREAMING ? `${baseClass}--streaming` : ''
      }`.trim()
    case MessageType.SYSTEM:
      return `${baseClass} ${baseClass}--system ${baseClass}--${message.systemType}`
    default:
      return baseClass
  }
}

/**
 * 메시지 시간 포맷팅
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) {
    return '방금 전'
  } else if (diffMins < 60) {
    return `${diffMins}분 전`
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

/**
 * 메시지 콘텐츠 미리보기 생성
 */
export const generateMessagePreview = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) {
    return content
  }
  
  return content.substring(0, maxLength).trim() + '...'
}

// =============================================================================
// 세션 관리 유틸리티
// =============================================================================

/**
 * 세션 제목 자동 생성
 */
export const generateSessionTitle = (
  initMode: ChatInitMode,
  firstMessage?: string,
  fileName?: string
): string => {
  switch (initMode) {
    case ChatInitMode.BLANK_SHEET:
      if (firstMessage) {
        return generateMessagePreview(firstMessage, 30)
      }
      return '새로운 채팅'
      
    case ChatInitMode.FILE_UPLOAD:
      if (fileName) {
        return `${fileName} 분석`
      }
      return '파일 분석'
      
    case ChatInitMode.EXISTING_CHAT:
      if (firstMessage) {
        return generateMessagePreview(firstMessage, 30)
      }
      return '채팅'
      
    default:
      return STORE_CONSTANTS.DEFAULT_SESSION_TITLE
  }
}

/**
 * 세션 검색
 */
export const searchSessions = (
  sessions: any[],
  query: string
): any[] => {
  if (!query.trim()) {
    return sessions
  }
  
  const lowercaseQuery = query.toLowerCase()
  
  return sessions.filter(session => 
    session.title.toLowerCase().includes(lowercaseQuery) ||
    session.lastMessage?.toLowerCase().includes(lowercaseQuery) ||
    session.metadata?.fileInfo?.fileName?.toLowerCase().includes(lowercaseQuery)
  )
}

// =============================================================================
// 성능 최적화 유틸리티
// =============================================================================

/**
 * 메시지 가상화를 위한 청크 분할
 */
export const chunkMessages = (messages: ChatMessage[], chunkSize: number = 50): ChatMessage[][] => {
  const chunks: ChatMessage[][] = []
  
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize))
  }
  
  return chunks
}

/**
 * 디바운스된 저장 함수
 */
export const createDebouncedSave = (
  saveFunction: () => void,
  delay: number = 1000
): (() => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      saveFunction()
      timeoutId = null
    }, delay)
  }
}

// =============================================================================
// 개발 도구 및 디버깅
// =============================================================================

/**
 * 스토어 상태 덤프 (개발용)
 */
export const dumpStoreState = (state: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Chat Store State Dump')
    console.log('Init Mode:', state.initMode)
    console.log('Is Initialized:', state.isInitialized)
    console.log('Current Session:', state.currentSessionId)
    console.log('Sessions Count:', state.sessions.length)
    console.log('Messages Count:', state.messages.length)
    console.log('Is Streaming:', state.isStreaming)
    console.log('Current Error:', state.error)
    console.groupEnd()
  }
}

/**
 * 액션 실행 시간 측정 데코레이터
 */
export const measureActionTime = <T extends (...args: any[]) => any>(
  actionName: string,
  action: T
): T => {
  return ((...args: any[]) => {
    const startTime = performance.now()
    const result = action(...args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now()
        console.log(`⏱️ Action "${actionName}" took ${(endTime - startTime).toFixed(2)}ms`)
      })
    } else {
      const endTime = performance.now()
      console.log(`⏱️ Action "${actionName}" took ${(endTime - startTime).toFixed(2)}ms`)
      return result
    }
  }) as T
}