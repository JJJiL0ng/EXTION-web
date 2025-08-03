// src/_store/chat/chatStore.ts
// v2 채팅 시스템 메인 상태 관리 스토어

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import {
  ChatInitMode,
  ChatInitParams,
  ChatSession,
  ChatMessage,
  MessageType,
  MessageStatus,
  CreateChatRequest,
  ChatError,
  UserMessage,
  AssistantMessage,
  StreamEvent,
  StreamEventType,
  UploadedFileInfo,
  ChatSessionStatus
} from '../../_types/chat.types'

import {
  ChatStore,
  createInitialState,
  STORE_CONSTANTS
} from './chatTypes'

// mainChatApi 어댑터 import
import { mainChatApiAdapter } from './mainChatApiAdapter'

// =============================================================================
// 유틸리티 함수들
// =============================================================================

/**
 * 고유 ID 생성
 */
const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 현재 타임스탬프 생성
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * 오류 객체 생성
 */
const createError = (code: string, message: string, recoverable = true): ChatError => ({
  code,
  message,
  timestamp: getCurrentTimestamp(),
  recoverable
})

/**
 * 사용자 메시지 생성
 */
const createUserMessage = (content: string, chatId: string): UserMessage => ({
  id: generateId('msg'),
  chatId,
  type: MessageType.USER,
  content,
  status: MessageStatus.COMPLETED,
  timestamp: getCurrentTimestamp()
})

/**
 * AI 응답 메시지 생성
 */
const createAssistantMessage = (chatId: string, content = ''): AssistantMessage => ({
  id: generateId('msg'),
  chatId,
  type: MessageType.ASSISTANT,
  content,
  status: MessageStatus.PENDING,
  timestamp: getCurrentTimestamp()
})

// =============================================================================
// 메인 채팅 스토어
// =============================================================================

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer<ChatStore>((set, get) => ({
          // =============================================================================
          // 상태 초기화
          // =============================================================================
          ...createInitialState(),

          // =============================================================================
          // 초기화 액션들
          // =============================================================================

          /**
           * 채팅 시스템 초기화
           */
          initialize: async (params: ChatInitParams): Promise<void> => {
            const { mode, fileInfo, existingChatId, spreadSheetId } = params

            try {
              set((state) => {
                state.isLoading = true
                state.error = null
                state.initMode = mode
                state.currentSpreadSheetId = spreadSheetId || null
                state.fileInfo = fileInfo || null
              })

              switch (mode) {
                case ChatInitMode.BLANK_SHEET:
                  // 빈 시트 모드 초기화
                  set((state) => {
                    state.sessions = []
                    state.currentSessionId = null
                    state.messages = []
                  })
                  break

                case ChatInitMode.FILE_UPLOAD:
                  if (!fileInfo) {
                    // fileInfo가 없으면 BLANK_SHEET 모드로 폴백
                    console.warn('FILE_UPLOAD mode requested but no fileInfo provided, falling back to BLANK_SHEET mode')
                    set((state) => {
                      state.initMode = ChatInitMode.BLANK_SHEET
                      state.sessions = []
                      state.currentSessionId = null
                      state.messages = []
                    })
                  } else {
                    // 파일 업로드 모드 초기화
                    set((state) => {
                      state.sessions = []
                      state.currentSessionId = null
                      state.messages = []
                      state.currentSpreadSheetId = fileInfo.spreadSheetId
                      state.fileInfo = fileInfo
                    })
                  }
                  break

                case ChatInitMode.EXISTING_CHAT:
                  try {
                    // 채팅 세션 목록 로드
                    const chatsResponse = await mainChatApiAdapter.loadChats()
                    
                    let targetSessionId = existingChatId
                    let messages: ChatMessage[] = []

                    // 특정 채팅이 지정되지 않았으면 가장 최근 채팅 사용
                    if (!targetSessionId && chatsResponse.sessions.length > 0) {
                      targetSessionId = chatsResponse.sessions[0].id
                    }

                    // 대상 세션의 메시지 로드
                    if (targetSessionId) {
                      const messagesResponse = await mainChatApiAdapter.loadMessages(targetSessionId)
                      messages = messagesResponse.messages
                    }

                    set((state) => {
                      state.sessions = chatsResponse.sessions
                      state.currentSessionId = targetSessionId || null
                      state.messages = messages
                      state.currentSpreadSheetId = targetSessionId 
                        ? chatsResponse.sessions.find(s => s.id === targetSessionId)?.spreadSheetId || null
                        : null
                    })

                  } catch (error) {
                    throw createError(
                      'LOAD_EXISTING_CHAT_ERROR',
                      'Failed to load existing chats'
                    )
                  }
                  break

                default:
                  throw new Error(`Unknown init mode: ${mode}`)
              }

              set((state) => {
                state.isInitialized = true
                state.isLoading = false
              })

            } catch (error) {
              const chatError = createError(
                'INIT_ERROR',
                error instanceof Error ? error.message : 'Failed to initialize chat'
              )
              
              set((state) => {
                state.error = chatError
                state.isLoading = false
                state.isInitialized = true // 에러가 발생해도 초기화 완료로 처리
              })
            }
          },

          /**
           * 스토어 리셋
           */
          reset: (): void => {
            set(() => createInitialState())
          },


          // =============================================================================
          // 세션 관리 액션들
          // =============================================================================

          /**
           * 새 채팅 세션 생성
           */
          createSession: async (request: CreateChatRequest): Promise<string> => {
            try {
              const response = await mainChatApiAdapter.createChat(request)
              
              const newSession: ChatSession = {
                id: response.chatId,
                title: response.title,
                spreadSheetId: request.spreadSheetId,
                status: ChatSessionStatus.ACTIVE,
                createdAt: response.createdAt,
                updatedAt: response.createdAt,
                messageCount: 0,
                metadata: {
                  initMode: request.initMode,
                  fileInfo: request.fileInfo
                }
              }

              set((state) => {
                state.sessions.unshift(newSession)
                state.currentSessionId = newSession.id
                state.messages = []
              })

              return response.chatId

            } catch (error) {
              const chatError = createError(
                'CREATE_SESSION_ERROR',
                'Failed to create new chat session'
              )
              set((state) => {
                state.error = chatError
              })
              throw chatError
            }
          },

          /**
           * 채팅 세션 목록 로드
           */
          loadSessions: async (): Promise<void> => {
            try {
              const response = await mainChatApiAdapter.loadChats()
              
              set((state) => {
                state.sessions = response.sessions
              })

            } catch (error) {
              throw createError('LOAD_SESSIONS_ERROR', 'Failed to load chat sessions')
            }
          },

          /**
           * 채팅 세션 전환
           */
          switchSession: async (sessionId: string): Promise<void> => {
            try {
              const response = await mainChatApiAdapter.loadMessages(sessionId)
              
              set((state) => {
                state.currentSessionId = sessionId
                state.messages = response.messages
                
                const session = state.sessions.find(s => s.id === sessionId)
                if (session) {
                  state.currentSpreadSheetId = session.spreadSheetId || null
                }
              })

            } catch (error) {
              throw createError('SWITCH_SESSION_ERROR', 'Failed to switch chat session')
            }
          },

          /**
           * 채팅 세션 삭제
           */
          deleteSession: async (sessionId: string): Promise<void> => {
            set((state) => {
              state.sessions = state.sessions.filter(s => s.id !== sessionId)
              
              // 현재 세션이 삭제된 경우 첫 번째 세션으로 전환
              if (state.currentSessionId === sessionId) {
                state.currentSessionId = state.sessions.length > 0 ? state.sessions[0].id : null
                state.messages = []
              }
            })
          },

          // =============================================================================
          // 메시지 관리 액션들
          // =============================================================================

          /**
           * 메시지 전송
           */
          sendMessage: async (content: string): Promise<void> => {
            const state = get()

            try {
              // 현재 세션이 없으면 자동으로 생성
              let sessionId = state.currentSessionId
              
              if (!sessionId) {
                // 현재 모드에 따라 채팅 생성
                const state = get()
                
                const request: CreateChatRequest = {
                  initMode: state.initMode!,
                  spreadSheetId: state.currentSpreadSheetId || undefined,
                  fileInfo: state.fileInfo || undefined
                }

                if (state.initMode === ChatInitMode.BLANK_SHEET) {
                  request.title = '새로운 채팅'
                } else if (state.initMode === ChatInitMode.FILE_UPLOAD && state.fileInfo) {
                  request.title = `${state.fileInfo.fileName} 분석`
                } else {
                  request.title = '채팅'
                }

                sessionId = await get().createSession(request)
              }

              // 사용자 메시지 추가
              const userMessage = createUserMessage(content, sessionId!)
              set((state) => {
                state.messages.push(userMessage)
              })

              // AI 응답 메시지 준비
              const assistantMessage = createAssistantMessage(sessionId!)
              set((state) => {
                state.messages.push(assistantMessage)
                state.isStreaming = true
                state.isInputDisabled = true
              })

              // mainChatApi를 통한 실제 스트리밍
              await mainChatApiAdapter.streamChat(
                {
                  chatId: sessionId!,
                  content,
                  spreadSheetId: state.currentSpreadSheetId || undefined
                },
                (content: string) => {
                  // 스트리밍 콘텐츠 업데이트
                  set((state) => {
                    const message = state.messages.find(m => m.id === assistantMessage.id)
                    if (message && message.type === MessageType.ASSISTANT) {
                      message.content = content
                      message.status = MessageStatus.STREAMING
                    }
                  })
                },
                () => {
                  // 스트리밍 완료
                  set((state) => {
                    const message = state.messages.find(m => m.id === assistantMessage.id)
                    if (message) {
                      message.status = MessageStatus.COMPLETED
                    }
                    state.isStreaming = false
                    state.isInputDisabled = false
                  })
                },
                (error: Error) => {
                  // 스트리밍 오류
                  set((state) => {
                    state.isStreaming = false
                    state.isInputDisabled = false
                    state.error = createError('STREAM_ERROR', error.message)
                  })
                }
              )

            } catch (error) {
              const chatError = createError(
                'SEND_MESSAGE_ERROR',
                'Failed to send message'
              )
              set((state) => {
                state.error = chatError
                state.isStreaming = false
                state.isInputDisabled = false
              })
            }
          },


          /**
           * 메시지 목록 로드
           */
          loadMessages: async (sessionId: string): Promise<void> => {
            try {
              const response = await mainChatApiAdapter.loadMessages(sessionId)
              
              set((state) => {
                if (state.currentSessionId === sessionId) {
                  state.messages = response.messages
                }
              })

            } catch (error) {
              throw createError('LOAD_MESSAGES_ERROR', 'Failed to load messages')
            }
          },

          // =============================================================================
          // 스트리밍 관련 액션들
          // =============================================================================

          /**
           * 스트리밍 이벤트 처리
           */
          handleStreamEvent: (event: StreamEvent): void => {
            switch (event.type) {
              case StreamEventType.START:
                set((state) => {
                  state.isStreaming = true
                })
                break

              case StreamEventType.DATA:
                if (event.data && event.messageId) {
                  set((state) => {
                    const message = state.messages.find(m => m.id === event.messageId)
                    if (message && message.type === MessageType.ASSISTANT) {
                      message.content += event.data
                      message.status = MessageStatus.STREAMING
                    }
                  })
                }
                break

              case StreamEventType.END:
                if (event.messageId) {
                  set((state) => {
                    const message = state.messages.find(m => m.id === event.messageId)
                    if (message) {
                      message.status = MessageStatus.COMPLETED
                    }
                    state.isStreaming = false
                    state.isInputDisabled = false
                  })
                }
                break

              case StreamEventType.ERROR:
                set((state) => {
                  state.isStreaming = false
                  state.isInputDisabled = false
                  if (event.error) {
                    state.error = event.error
                  }
                })
                break
            }
          },

          // =============================================================================
          // 오류 처리 액션들
          // =============================================================================

          /**
           * 오류 설정
           */
          setError: (error: ChatError | null): void => {
            set((state) => {
              state.error = error
            })
          },

          /**
           * 오류 제거
           */
          clearError: (): void => {
            set((state) => {
              state.error = null
            })
          },

          // =============================================================================
          // 셀렉터들
          // =============================================================================

          getInitMode: () => get().initMode,
          getIsInitialized: () => get().isInitialized,
          getIsLoading: () => get().isLoading,

          getCurrentSession: () => {
            const state = get()
            return state.sessions.find(s => s.id === state.currentSessionId) || null
          },

          getSessionById: (id: string) => {
            return get().sessions.find(s => s.id === id) || null
          },

          getAllSessions: () => get().sessions,

          getMessages: () => get().messages,

          getMessagesBySessionId: (sessionId: string) => {
            return get().messages.filter(m => m.chatId === sessionId)
          },

          getLastMessage: () => {
            const messages = get().messages
            return messages.length > 0 ? messages[messages.length - 1] : null
          },

          getCanSendMessage: () => {
            const state = get()
            return state.isInitialized && !state.isInputDisabled && !state.isStreaming
          },

          getAvailableActions: () => {
            const state = get()
            return {
              canShowChatList: state.initMode === ChatInitMode.EXISTING_CHAT,
              canCreateNewChat: state.currentSessionId !== null,
              canSwitchChat: state.initMode === ChatInitMode.EXISTING_CHAT && state.sessions.length > 1,
              showWelcomeMessage: !state.currentSessionId
            }
          },

          getError: () => get().error,
          getHasError: () => get().error !== null

        }))
      ),
      {
        name: STORE_CONSTANTS.PERSIST_KEY,
        version: STORE_CONSTANTS.VERSION,
        partialize: (state) => ({
          // 지속성이 필요한 상태만 저장
          sessions: state.sessions,
          currentSessionId: state.currentSessionId,
          currentSpreadSheetId: state.currentSpreadSheetId
        })
      }
    ),
    {
      name: 'chat-store'
    }
  )
)