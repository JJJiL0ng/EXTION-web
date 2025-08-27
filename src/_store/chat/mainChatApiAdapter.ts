// src/_store/chat/mainChatApiAdapter.ts
// mainChatApi.ts와 v2 스토어 간의 어댑터

import { MainChatApi, ChatRequest, createChatRequest, NewChatResponseData } from '../../_Api/chat/mainChatApi'
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
import useChatStore from './chatIdStore'
import useSpreadsheetIdStore from '../sheet/spreadSheetIdStore'
import useSpreadsheetNamesStore from '../sheet/spreadSheetNamesStore'
import { getOrCreateGuestId } from '../../_utils/guestUtils'

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
    // 전역 상태에서 chatId 가져오기
    const { chatId: globalChatId } = useChatStore.getState()

    const chatId = globalChatId

    if (!chatId) {
      throw new Error('채팅 ID가 없습니다. 먼저 채팅을 시작해 주세요.')
    }

    return {
      chatId,
      title: request.title || '새로운 채팅',
      createdAt: new Date().toISOString()
    }
  }

  /**
   * 채팅 세션 목록 로드 (Mock 데이터) : todo
   */
  async loadChats(): Promise<LoadChatsResponse> {
    // 전역 상태에서 chatId와 spreadsheetId 가져오기
    const { chatId: globalChatId } = useChatStore.getState()
    const { spreadsheetId: globalSpreadsheetId } = useSpreadsheetIdStore.getState()

    // mainChatApi에서는 getUserChats 메서드 사용
    // 현재는 Mock 데이터로 대체
    await new Promise(resolve => setTimeout(resolve, 300))

    const sessions: ChatSession[] = [
      {
        id: globalChatId || 'session_1',
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
   * 메시지 목록 로드 (Mock 데이터) : todo
   */
  async loadMessages(sessionId: string): Promise<LoadMessagesResponse> {
    // 전역 상태에서 chatId와 spreadsheetId 가져오기
    const { chatId: globalChatId } = useChatStore.getState()
    const { spreadsheetId: globalSpreadsheetId } = useSpreadsheetIdStore.getState()

    // 전역 상태의 chatId 사용, 없으면 sessionId 사용
    const chatId = globalChatId || sessionId

    // mainChatApi에서는 getChatHistory 메서드 사용
    // 현재는 Mock 데이터로 대체
    await new Promise(resolve => setTimeout(resolve, 200))

    const messages: ChatMessage[] = [
      {
        id: `msg_${Date.now()}_1`,
        chatId: chatId,
        type: MessageType.USER,
        content: '안녕하세요! 도움이 필요합니다.',
        status: MessageStatus.COMPLETED,
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: `msg_${Date.now()}_2`,
        chatId: chatId,
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
    // 전역 상태에서 chatId와 spreadsheetId 가져오기
    const { chatId: globalChatId } = useChatStore.getState()
    const { spreadsheetId: globalSpreadsheetId } = useSpreadsheetIdStore.getState()

    // 현재 선택된 시트 이름들을 공용 저장소에서 가져오기
    const selectedNames = useSpreadsheetNamesStore.getState().selectedSheets.map(s => s.name)
    const parsedSheetNames = selectedNames

    console.log('🔍 [MainChatApiAdapter] sendMessage - Global state values:', {
      globalChatId,
      globalSpreadsheetId,
      requestChatId: request.chatId,
      requestSpreadSheetId: request.spreadSheetId
    });

    // 요청에서 온 값 또는 전역 상태값 사용 (null을 undefined로 변환)
    const chatId = request.chatId || globalChatId || undefined
    const spreadsheetId = request.spreadSheetId || globalSpreadsheetId || undefined

    console.log('📤 [MainChatApiAdapter] sendMessage - Final values:', {
      chatId,
      spreadsheetId
    });

    // mainChatApi의 ChatRequest 형식으로 변환
    const userId = getOrCreateGuestId(); // Guest ID 사용
    const chatRequest: ChatRequest = createChatRequest(
      request.content,
      userId,
      parsedSheetNames,
      {
        chatId: chatId,
        spreadsheetId: spreadsheetId
      }
    )

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      messageId,
      chatId: chatId || `new_chat_${Date.now()}`,
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
    onError: (error: Error) => void,
    onStructuredResponse?: (structuredContent: any) => void, // 새로운 콜백 추가
    onReasoningPreview?: (reasoning: string, isComplete: boolean) => void // Reasoning Preview 콜백 추가
  ): Promise<void> {
    console.log('🔄 [MainChatApiAdapter] Creating chat request:', {
      originalRequest: request,
      timestamp: new Date().toISOString()
    });

    // 전역 상태에서 chatId와 spreadsheetId 가져오기
    const { chatId: globalChatId } = useChatStore.getState()
    const { spreadsheetId: globalSpreadsheetId } = useSpreadsheetIdStore.getState()

    // 현재 선택된 시트 이름들을 공용 저장소에서 가져오기
    const selectedNames = useSpreadsheetNamesStore.getState().selectedSheets.map(s => s.name)
    const parsedSheetNames = selectedNames

    console.log('🔍 [MainChatApiAdapter] streamChat - Global state values:', {
      globalChatId,
      globalSpreadsheetId,
      requestChatId: request.chatId,
      requestSpreadSheetId: request.spreadSheetId
    });

    // 요청에서 온 값 또는 전역 상태값 사용 (null을 undefined로 변환)
    const chatId = request.chatId || globalChatId || undefined
    const spreadsheetId = request.spreadSheetId || globalSpreadsheetId || undefined

    console.log('📤 [MainChatApiAdapter] streamChat - Final values:', {
      chatId,
      spreadsheetId
    });

    const userId = getOrCreateGuestId(); // Guest ID 사용
    const chatRequest: ChatRequest = createChatRequest(
      request.content,
      userId,
      parsedSheetNames,
      {
        chatId: chatId,
        spreadsheetId: spreadsheetId
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

      onReasoningPreview: (data: any) => {
        console.log('🧠 [MainChatApiAdapter] Reasoning preview:', {
          reasoning: data.reasoning?.substring(0, 100) + (data.reasoning?.length > 100 ? '...' : ''),
          isComplete: data.isComplete,
          userMessageId: data.userMessageId,
          hasCallback: !!onReasoningPreview
        })
        if (onReasoningPreview) {
          onReasoningPreview(data.reasoning || '', data.isComplete || false)
        }
      },

      onChatResponse: (data: NewChatResponseData & { intent?: string, structuredContent?: any }) => {
        console.log('💬 [MainChatApiAdapter] Chat response:', data)
        // structuredContent가 있으면 콜백으로 전달
        if (data.structuredContent && onStructuredResponse) {
          onStructuredResponse(data.structuredContent)
        }
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
        // console.log('⌨️ [MainChatApiAdapter] Typing effect:', {
        //   textLength: currentText.length,
        //   isComplete,
        //   preview: currentText.substring(0, 50) + (currentText.length > 50 ? '...' : '')
        // })
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