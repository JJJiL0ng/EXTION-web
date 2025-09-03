import { aiChatApiRes } from "../ai-chat-api/aiChatApi.types"; 

export type MessageType = 'user' | 'assistant' | 'system' | 'error';

export type MessageStatus = 'pending' | 'sent' | 'streaming' | 'completed' | 'error';
export interface ChatMessage {
  id: string; // 메시지의 고유 식별자 (렌더링 key 및 업데이트 추적에 사용)
  type: MessageType; // 메시지 주체 ('user', 'assistant', 'system', 'error')
  content: string | aiChatApiRes ; // 메시지의 실제 텍스트 내용
  timestamp: number; // 메시지가 생성된 시간 (new Date().getTime() 또는 Date.now())
  isStreaming?: boolean; // type이 'assistant'일 때, 스트리밍 중인지 여부
  status: MessageStatus;
}

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ChatState {
  messages: ChatMessage[]; // 전체 채팅 메시지 배열
  webSocket: WebSocket | null; // 현재 연결된 WebSocket 인스턴스
  wsConnectionStatus: WebSocketConnectionStatus; // 웹소켓 연결 상태
  wsError: string | null; // 웹소켓 연결 오류 메시지
  currentAssistantMessageId: string | null; // 현재 스트리밍 중인 AI 메시지의 ID (하나의 AI만 스트리밍한다고 가정)
  websocketId: string | null; // 백엔드에서 부여하는 웹소켓 세션 ID 등 (필요 시)
  userId: string | null; // 현재 로그인된 사용자 ID (필요 시)
  spreadsheetId: string | null; // 현재 활성 스프레드시트 ID (도메인 특정)
  chatId: string | null; // 현재 활성 대화방 ID
  isTyping: boolean;
  isSendingMessage: boolean;
  aiThinkingIndicatorVisible: boolean;
}