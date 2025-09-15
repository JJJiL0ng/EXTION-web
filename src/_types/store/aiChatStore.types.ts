import { aiChatApiRes } from "../apiConnector/ai-chat-api/aiChatApi.types";
import { TaskManagerOutput } from "../apiConnector/ai-chat-api/task.types";

export type MessageStatus = 'pending' | 'sent' | 'streaming' | 'completed' | 'error';

interface BaseMessage {
  id: string;
  timestamp: number;
  status: MessageStatus;
  isStreaming?: boolean; // assistant 메시지일때만 사용되는 필드임
}

export interface UserMessage extends BaseMessage {
  type: 'user';       // 'type'을 고정된 문자열 리터럴로 지정 (이것이 식별자)
  content: string;    // UserMessage의 content는 항상 string
}

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: string; // taskManagerOutput.reason 타입이 들어갈 예정
  aiChatRes?: aiChatApiRes; // AssistantMessage는 둘 다 가능
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;    // SystemMessage의 content는 항상 string
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  content: string;
}

// 3. 모든 구체적인 메시지 타입을 |(Union)으로 묶어 최종 타입을 만듦
export type ChatMessage = UserMessage | AssistantMessage | SystemMessage | ErrorMessage;

// export type MessageType = 'user' | 'assistant' | 'system' | 'error';

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';


// aiChatState + userid + spreadsheetid + parsedSheetNames 
export interface AiChatState {
  chatId: string | null; // 현재 채팅 세션 ID
  messages: ChatMessage[]; // 전체 채팅 메시지 배열
  webSocket: WebSocket | null; // 현재 연결된 WebSocket 인스턴스
  wsConnectionStatus: WebSocketConnectionStatus; // 웹소켓 연결 상태
  wsError: string | null; // 웹소켓 연결 오류 메시지
  currentAssistantMessageId: string | null; // 현재 스트리밍 중인 AI 메시지의 ID (하나의 AI만 스트리밍한다고 가정)
  websocketId: string | null; // 백엔드에서 부여하는 웹소켓 세션 ID 등 (필요 시)
  isTyping: boolean;
  isSendingMessage: boolean;
  aiThinkingIndicatorVisible: boolean;
}


// 기존 채팅 히스토리를 볼러올때 사용
export interface previousMessagesContent {
    role: 'user' | 'assistant';
    content: string;
}