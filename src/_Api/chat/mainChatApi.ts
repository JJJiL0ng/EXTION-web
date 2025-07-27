// mainChatApi.ts - React용 메인 채팅 API 클라이언트
// SSE 스트리밍을 통한 실시간 타이핑 효과 구현

// ==================== 타입 정의 ====================

export interface ChatRequest {
  chatInputMessage: string;
  spreadsheetId?: string;
  chatId?: string;
  userId: string;
  timestamp: string;
}

export interface ChatHistoryRequest {
  chatId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

export interface UserChatListRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

// SSE 이벤트 타입
export enum SSEEventType {
  CHAT_STARTED = 'chat_started',
  AI_PROCESSING_STARTED = 'ai_processing_started',
  AI_UPDATE = 'ai_update',
  CHAT_RESPONSE = 'chat_response',
  CHAT_COMPLETED = 'chat_completed',
  ERROR = 'error'
}

// SSE 이벤트 데이터 인터페이스
export interface SSEEventData {
  chatId: string;
  timestamp: string;
  [key: string]: any;
}

export interface ChatStartedData extends SSEEventData {
  messageId: string;
}

export interface AIProcessingStartedData extends SSEEventData {
  userMessageId: string;
}

export interface AIUpdateData extends SSEEventData {
  userMessageId: string;
  step: string;
  progress: number;
  updateType: string;
}

export interface ChatResponseData extends SSEEventData {
  message: string;
  intent: string;
  [key: string]: any; // 다양한 응답 타입에 대응
}

export interface ChatCompletedData extends SSEEventData {
  assistantMessageId: string;
}

export interface ErrorData extends SSEEventData {
  error: string;
  details?: string;
}

// 채팅 상태
export enum ChatStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  PROCESSING = 'processing',
  TYPING = 'typing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 이벤트 핸들러 타입
export interface ChatEventHandlers {
  onChatStarted?: (data: ChatStartedData) => void;
  onAIProcessingStarted?: (data: AIProcessingStartedData) => void;
  onAIUpdate?: (data: AIUpdateData) => void;
  onChatResponse?: (data: ChatResponseData) => void;
  onChatCompleted?: (data: ChatCompletedData) => void;
  onError?: (data: ErrorData) => void;
  onTypingEffect?: (currentText: string, isComplete: boolean) => void;
  onStatusChange?: (status: ChatStatus) => void;
}

// 타이핑 효과 설정
export interface TypingConfig {
  enabled: boolean;
  speed: number; // 문자당 밀리초 (기본: 30ms)
  minSpeed: number; // 최소 속도 (기본: 10ms)
  maxSpeed: number; // 최대 속도 (기본: 100ms)
  punctuationDelay: number; // 구두점 후 추가 지연 (기본: 200ms)
  wordDelay: number; // 단어 후 지연 (기본: 50ms)
}

// API 클라이언트 설정
export interface ChatApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  typing: TypingConfig;
}

// ==================== 기본 설정 ====================

const DEFAULT_CONFIG: ChatApiConfig = {
  baseUrl: '/v2/main-chat',
  timeout: 120000, // 2분
  retryAttempts: 3,
  retryDelay: 1000,
  typing: {
    enabled: true,
    speed: 30,
    minSpeed: 10,
    maxSpeed: 100,
    punctuationDelay: 200,
    wordDelay: 50
  }
};

// ==================== 메인 API 클래스 ====================

export class MainChatApi {
  private config: ChatApiConfig;
  private abortController: AbortController | null = null;
  private eventSource: EventSource | null = null;
  private currentStatus: ChatStatus = ChatStatus.IDLE;
  private typingTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ChatApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== 메인 스트리밍 채팅 API ====================

  /**
   * 스트리밍 채팅 시작
   */
  async streamChat(
    request: ChatRequest,
    handlers: ChatEventHandlers
  ): Promise<void> {
    // 이전 연결 정리
    this.cleanup();
    
    this.updateStatus(ChatStatus.CONNECTING, handlers);

    try {
      // fetch를 사용한 SSE 연결
      const response = await fetch(`${this.config.baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ReadableStream을 사용한 SSE 파싱
      await this.processSSEStream(response, handlers);

    } catch (error) {
      this.updateStatus(ChatStatus.ERROR, handlers);
      
      if (handlers.onError) {
        handlers.onError({
          chatId: request.chatId || 'unknown',
          timestamp: new Date().toISOString(),
          error: 'Connection failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * SSE 스트림 처리
   */
  private async processSSEStream(
    response: Response,
    handlers: ChatEventHandlers
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        const value = result.value;
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE 이벤트 파싱
        const events = this.parseSSEBuffer(buffer);
        buffer = events.remainingBuffer;

        // 각 이벤트 처리
        for (const event of events.events) {
          await this.handleSSEEvent(event, handlers);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * SSE 버퍼 파싱
   */
  private parseSSEBuffer(buffer: string): { events: any[], remainingBuffer: string } {
    const events = [];
    const lines = buffer.split('\n');
    let i = 0;
    let remainingBuffer = '';

    while (i < lines.length) {
      if (lines[i].startsWith('event:') && i + 1 < lines.length && lines[i + 1].startsWith('data:')) {
        const eventType = lines[i].substring(6).trim();
        const eventData = lines[i + 1].substring(5).trim();
        
        try {
          const parsedData = JSON.parse(eventData);
          events.push({ type: eventType, data: parsedData });
          i += 3; // event, data, empty line
        } catch (error) {
          console.warn('Failed to parse SSE event data:', eventData);
          i++;
        }
      } else if (i === lines.length - 1 && !lines[i].includes('\n')) {
        // 마지막 불완전한 라인
        remainingBuffer = lines[i];
        break;
      } else {
        i++;
      }
    }

    return { events, remainingBuffer };
  }

  /**
   * SSE 이벤트 핸들러
   */
  private async handleSSEEvent(
    event: { type: string, data: any },
    handlers: ChatEventHandlers
  ): Promise<void> {
    const { type, data } = event;

    switch (type) {
      case SSEEventType.CHAT_STARTED:
        this.updateStatus(ChatStatus.PROCESSING, handlers);
        handlers.onChatStarted?.(data);
        break;

      case SSEEventType.AI_PROCESSING_STARTED:
        handlers.onAIProcessingStarted?.(data);
        break;

      case SSEEventType.AI_UPDATE:
        handlers.onAIUpdate?.(data);
        break;

      case SSEEventType.CHAT_RESPONSE:
        this.updateStatus(ChatStatus.TYPING, handlers);
        await this.handleTypingEffect(data, handlers);
        break;

      case SSEEventType.CHAT_COMPLETED:
        this.updateStatus(ChatStatus.COMPLETED, handlers);
        handlers.onChatCompleted?.(data);
        break;

      case SSEEventType.ERROR:
        this.updateStatus(ChatStatus.ERROR, handlers);
        handlers.onError?.(data);
        break;

      default:
        console.warn('Unknown SSE event type:', type);
    }
  }

  /**
   * 타이핑 효과 처리
   */
  private async handleTypingEffect(
    data: ChatResponseData,
    handlers: ChatEventHandlers
  ): Promise<void> {
    // 먼저 전체 응답 데이터를 전달
    handlers.onChatResponse?.(data);

    // 타이핑 효과가 비활성화된 경우 즉시 완료 처리
    if (!this.config.typing.enabled) {
      handlers.onTypingEffect?.(data.message, true);
      return;
    }

    const message = data.message;
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      if (currentIndex >= message.length) {
        handlers.onTypingEffect?.(message, true);
        return;
      }

      const currentText = message.substring(0, currentIndex + 1);
      handlers.onTypingEffect?.(currentText, false);

      currentIndex++;

      // 다음 문자 지연 시간 계산
      const char = message[currentIndex - 1];
      let delay = this.config.typing.speed;

      // 구두점 후 추가 지연
      if (/[.!?]/.test(char)) {
        delay += this.config.typing.punctuationDelay;
      }
      // 단어 경계에서 추가 지연
      else if (/\s/.test(char)) {
        delay += this.config.typing.wordDelay;
      }

      // 속도 범위 제한
      delay = Math.max(this.config.typing.minSpeed, 
                      Math.min(this.config.typing.maxSpeed, delay));

      this.typingTimer = setTimeout(typeNextCharacter, delay);
    };

    // 타이핑 시작
    typeNextCharacter();
  }

  /**
   * 상태 업데이트
   */
  private updateStatus(status: ChatStatus, handlers: ChatEventHandlers): void {
    this.currentStatus = status;
    handlers.onStatusChange?.(status);
  }

  // ==================== 일반 API 메서드 ====================

  /**
   * 채팅 기록 조회
   */
  async getChatHistory(request: ChatHistoryRequest): Promise<any> {
    const queryParams = new URLSearchParams({
      limit: (request.limit || 50).toString(),
      offset: (request.offset || 0).toString()
    });

    const response = await fetch(`${this.config.baseUrl}/${request.chatId}/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: request.userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 사용자 채팅 목록 조회
   */
  async getUserChats(request: UserChatListRequest): Promise<any> {
    const queryParams = new URLSearchParams({
      limit: (request.limit || 20).toString(),
      offset: (request.offset || 0).toString()
    });

    const response = await fetch(`${this.config.baseUrl}/list?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: request.userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to get user chats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 헬스 체크
   */
  async getHealth(): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== 유틸리티 메서드 ====================

  /**
   * 현재 상태 반환
   */
  getCurrentStatus(): ChatStatus {
    return this.currentStatus;
  }

  /**
   * 타이핑 효과 중단
   */
  stopTyping(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  /**
   * 연결 중단
   */
  abort(): void {
    this.cleanup();
    this.updateStatus(ChatStatus.IDLE, {});
  }

  /**
   * 리소스 정리
   */
  private cleanup(): void {
    this.stopTyping();
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * 소멸자
   */
  destroy(): void {
    this.cleanup();
  }
}

// ==================== 헬퍼 함수 ====================

/**
 * 채팅 요청 생성 헬퍼
 */
export function createChatRequest(
  message: string,
  userId: string,
  options?: {
    spreadsheetId?: string;
    chatId?: string;
  }
): ChatRequest {
  return {
    chatInputMessage: message,
    userId,
    timestamp: new Date().toISOString(),
    ...options
  };
}

/**
 * 기본 이벤트 핸들러 생성
 */
export function createDefaultHandlers(
  onMessage: (message: string, isTyping: boolean) => void,
  onError?: (error: string) => void,
  onStatusChange?: (status: ChatStatus) => void
): ChatEventHandlers {
  return {
    onTypingEffect: (currentText: string, isComplete: boolean) => {
      onMessage(currentText, !isComplete);
    },
    onError: (data: ErrorData) => {
      onError?.(data.error);
    },
    onStatusChange: (status: ChatStatus) => {
      onStatusChange?.(status);
    }
  };
}

// ==================== 전역 인스턴스 (선택사항) ====================

// 싱글톤 인스턴스
let defaultApiInstance: MainChatApi | null = null;

/**
 * 기본 API 인스턴스 반환
 */
export function getDefaultChatApi(config?: Partial<ChatApiConfig>): MainChatApi {
  if (!defaultApiInstance) {
    defaultApiInstance = new MainChatApi(config);
  }
  return defaultApiInstance;
}

export default MainChatApi;