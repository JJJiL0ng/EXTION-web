// // src/_Api/chat/chatApiV2.ts
// // v2 채팅 시스템용 API 함수들

// import {
//   CreateChatRequest,
//   CreateChatResponse,
//   SendMessageRequest,
//   SendMessageResponse,
//   LoadChatsResponse,
//   LoadMessagesResponse,
//   ChatMessage,
//   ChatSession,
//   MessageType,
//   MessageStatus,
//   ChatSessionStatus
// } from '../../_types/chat.types'

// // =============================================================================
// // Mock API (개발용)
// // =============================================================================

// /**
//  * 개발용 Mock 데이터
//  */
// const createMockMessage = (
//   content: string,
//   type: MessageType,
//   sessionId: string
// ): ChatMessage => {
//   const baseMessage = {
//     id: `msg_${Date.now()}_${Math.random()}`,
//     chatId: sessionId,
//     content,
//     timestamp: new Date().toISOString()
//   }
  
//   // 타입별로 분기 처리
//   if (type === MessageType.SYSTEM) {
//     return {
//       ...baseMessage,
//       type: MessageType.SYSTEM,
//       status: MessageStatus.COMPLETED,
//       systemType: 'info' as const
//     }
//   } else if (type === MessageType.USER) {
//     return {
//       ...baseMessage,
//       type: MessageType.USER,
//       status: MessageStatus.COMPLETED
//     }
//   } else {
//     return {
//       ...baseMessage,
//       type: MessageType.ASSISTANT,
//       status: MessageStatus.COMPLETED
//     }
//   }
// }

// const createMockSession = (title: string): ChatSession => ({
//   id: `session_${Date.now()}_${Math.random()}`,
//   title,
//   status: ChatSessionStatus.ACTIVE,
//   createdAt: new Date().toISOString(),
//   updatedAt: new Date().toISOString(),
//   messageCount: 0
// })

// /**
//  * Mock API 함수들 (실제 백엔드가 없을 때 사용)
//  */
// export const mockApi = {
//   createChat: async (request: CreateChatRequest): Promise<CreateChatResponse> => {
//     // 지연 시뮬레이션
//     await new Promise(resolve => setTimeout(resolve, 500))
    
//     const session = createMockSession(request.title || '새로운 채팅')
    
//     return {
//       chatId: session.id,
//       title: session.title,
//       createdAt: session.createdAt
//     }
//   },

//   loadChats: async (): Promise<LoadChatsResponse> => {
//     await new Promise(resolve => setTimeout(resolve, 300))
    
//     // Mock 세션 데이터
//     const sessions: ChatSession[] = [
//       {
//         id: 'session_1',
//         title: '엑셀 데이터 분석',
//         status: ChatSessionStatus.ACTIVE,
//         createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
//         updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
//         messageCount: 5,
//         lastMessage: '데이터 분석이 완료되었습니다.'
//       },
//       {
//         id: 'session_2',
//         title: '새로운 채팅',
//         status: ChatSessionStatus.ACTIVE,
//         createdAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
//         updatedAt: new Date(Date.now() - 1800000).toISOString(), // 30분 전
//         messageCount: 3,
//         lastMessage: '안녕하세요!'
//       }
//     ]
    
//     return {
//       sessions,
//       totalCount: sessions.length,
//       hasMore: false
//     }
//   },

//   loadMessages: async (sessionId: string): Promise<LoadMessagesResponse> => {
//     await new Promise(resolve => setTimeout(resolve, 200))
    
//     // Mock 메시지 데이터
//     const messages: ChatMessage[] = [
//       createMockMessage('안녕하세요! 도움이 필요하신가요?', MessageType.USER, sessionId),
//       createMockMessage('네, 안녕하세요! 어떤 도움이 필요하신지 말씀해 주세요.', MessageType.ASSISTANT, sessionId)
//     ]
    
//     return {
//       messages,
//       totalCount: messages.length,
//       hasMore: false
//     }
//   },

//   sendMessage: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
//     await new Promise(resolve => setTimeout(resolve, 100))
    
//     const messageId = `msg_${Date.now()}_${Math.random()}`
    
//     return {
//       messageId,
//       chatId: request.chatId || 'new_session',
//       status: 'accepted',
//       streamUrl: `/api/chat/stream/${messageId}`
//     }
//   }
// }

// // =============================================================================
// // 환경별 API 선택
// // =============================================================================

// /**
//  * 현재는 Mock API만 사용 (개발용)
//  */
// export const chatApi = {
//   createChat: mockApi.createChat,
//   loadChats: mockApi.loadChats,
//   loadMessages: mockApi.loadMessages,
//   sendMessage: mockApi.sendMessage
// }

// export default chatApi