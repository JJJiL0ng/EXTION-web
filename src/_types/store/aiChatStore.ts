import { aiChatApiRes } from "../ai-chat-api/aiChatApi.types"; 

export type MessageType = 'user' | 'assistant' ;

export type MessageStatus = 'pending' | 'sent' | 'streaming' | 'completed' | 'error';

export type UserMessage = {
  text: string;
};

export interface ChatMessage {
  id: string; // 메시지의 고유 식별자 (렌더링 key 및 업데이트 추적에 사용)
  type: MessageType; // 메시지 주체 ('user', 'assistant', 'system', 'error')
  content: UserMessage | aiChatApiRes ; // 메시지의 실제 텍스트 내용
  timestamp: number; // 메시지가 생성된 시간 (new Date().getTime() 또는 Date.now())
}

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ChatState {
  messages: ChatMessage[]; // 전체 채팅 메시지 배열
  webSocket: WebSocket | null; // 현재 연결된 WebSocket 인스턴스
  wsConnectionStatus: WebSocketConnectionStatus; // 웹소켓 연결 상태
  wsError: string | null; // 웹소켓 연결 오류 메시지
  currentAssistantMessageId: string | null; // 현재 스트리밍 중인 AI 메시지의 ID (하나의 AI만 스트리밍한다고 가정)
  websocketId: string;
  userId: string;
  spreadsheetId: string;
  chatId: string;
  isTyping: boolean;
}