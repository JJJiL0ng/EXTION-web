// src/_store/chat/mainChatApiAdapter.ts
// mainChatApi.ts와 v2 스토어 간의 어댑터

import { MainChatApi, ChatRequest, createChatRequest } from '../../_Api/chat/mainChatApi'
import {
  CreateChatRequest,
  CreateChatResponse,
  SendMessageRequest,
  SendMessageResponse,
  LoadChatsResponse,
  LoadMessagesResponse,
  ChatMessage,
  ChatSession,
  MessageType,
  MessageStatus,
  ChatSessionStatus
} from '../../_types/chat.types'

/**
 * mainChatApi를 v2 인터페이스에 맞게 어댑터
 */
export class MainChatApiAdapter {
  private api: MainChatApi

  constructor() {
    this.api = new MainChatApi()
  }

  /**
   * 채팅 세션 생성 (실제로는 첫 메시지 전송 시 생성됨)
   */
  async createChat(request: CreateChatRequest): Promise<CreateChatResponse> {
    // mainChatApi는 세션을 미리 생성하지 않고 첫 메시지 전송 시 생성
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      chatId,
      title: request.title || '새로운 채팅',
      createdAt: new Date().toISOString()
    }
  }

  /**
   * 채팅 세션 목록 로드 (Mock 데이터)
   */
  async loadChats(): Promise<LoadChatsResponse> {
    // mainChatApi에서는 getUserChats 메서드 사용
    // 현재는 Mock 데이터로 대체
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const sessions: ChatSession[] = [
      {
        id: 'session_1',
        title: '엑셀 데이터 분석',
        status: ChatSessionStatus.ACTIVE,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        messageCount: 5,
        lastMessage: '데이터 분석이 완료되었습니다.'
      },
      {
        id: 'session_2',
        title: '새로운 채팅',
        status: ChatSessionStatus.ACTIVE,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        messageCount: 3,
        lastMessage: '안녕하세요!'
      }
    ]
    
    return {
      sessions,
      totalCount: sessions.length,
      hasMore: false
    }
  }

  /**
   * 메시지 목록 로드 (Mock 데이터)
   */
  async loadMessages(sessionId: string): Promise<LoadMessagesResponse> {
    // mainChatApi에서는 getChatHistory 메서드 사용
    // 현재는 Mock 데이터로 대체
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const messages: ChatMessage[] = [
      {
        id: `msg_${Date.now()}_1`,
        chatId: sessionId,
        type: MessageType.USER,
        content: '안녕하세요! 도움이 필요합니다.',
        status: MessageStatus.COMPLETED,
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: `msg_${Date.now()}_2`,
        chatId: sessionId,
        type: MessageType.ASSISTANT,
        content: '안녕하세요! 어떤 도움이 필요하신지 말씀해 주세요.',
        status: MessageStatus.COMPLETED,
        timestamp: new Date(Date.now() - 240000).toISOString()
      }
    ]
    
    return {
      messages,
      totalCount: messages.length,
      hasMore: false
    }
  }

  /**
   * 메시지 전송
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    // mainChatApi의 ChatRequest 형식으로 변환
    const chatRequest: ChatRequest = createChatRequest(
      request.content,
      'default-user', // 실제로는 request에서 userId를 받아야 함
      {
        chatId: request.chatId,
        spreadsheetId: request.spreadSheetId
      }
    )

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      messageId,
      chatId: request.chatId || `new_chat_${Date.now()}`,
      status: 'accepted',
      streamUrl: `/api/chat/stream/${messageId}`
    }
  }

  /**
   * 스트리밍 채팅 시작 (실제 mainChatApi 사용)
   */
  async streamChat(
    request: SendMessageRequest,
    onMessage: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    console.log('🔄 [MainChatApiAdapter] Creating chat request:', {
      originalRequest: request,
      timestamp: new Date().toISOString()
    });

    const chatRequest: ChatRequest = createChatRequest(
      request.content,
      'default-user',
      {
        chatId: request.chatId,
        spreadsheetId: request.spreadSheetId
      }
    )

    console.log('📤 [MainChatApiAdapter] Converted to ChatRequest:', {
      chatRequest,
      timestamp: new Date().toISOString()
    });

    const handlers = {
      onChatStarted: (data: any) => {
        console.log('🟢 [MainChatApiAdapter] Chat started:', data)
      },
      
      onAIProcessingStarted: (data: any) => {
        console.log('🧠 [MainChatApiAdapter] AI processing started:', data)
      },
      
      onAIUpdate: (data: any) => {
        console.log('🔄 [MainChatApiAdapter] AI update:', data)
      },
      
      onChatResponse: (data: any) => {
        console.log('💬 [MainChatApiAdapter] Chat response:', data)
      },
      
      onChatCompleted: (data: any) => {
        console.log('✅ [MainChatApiAdapter] Chat completed:', data)
        onComplete()
      },
      
      onError: (data: any) => {
        console.error('❌ [MainChatApiAdapter] Chat error:', data)
        onError(new Error(data.error || 'Chat error occurred'))
      },
      
      onTypingEffect: (currentText: string, isComplete: boolean) => {
        console.log('⌨️ [MainChatApiAdapter] Typing effect:', {
          textLength: currentText.length,
          isComplete,
          preview: currentText.substring(0, 50) + (currentText.length > 50 ? '...' : '')
        })
        onMessage(currentText)
        if (isComplete) {
          onComplete()
        }
      },
      
      onStatusChange: (status: any) => {
        console.log('📊 [MainChatApiAdapter] Status change:', status)
      }
    }

    try {
      console.log('🚀 [MainChatApiAdapter] Starting API stream chat...')
      await this.api.streamChat(chatRequest, handlers)
    } catch (error) {
      console.error('❌ [MainChatApiAdapter] Stream chat failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      onError(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  /**
   * 연결 중단
   */
  abort(): void {
    this.api.abort()
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.api.destroy()
  }
}

// 싱글톤 인스턴스
export const mainChatApiAdapter = new MainChatApiAdapter()
export default mainChatApiAdapter