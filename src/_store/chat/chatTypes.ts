// src/_store/chat/chatTypes.ts
// 채팅 스토어 전용 타입 정의

import { 
  ChatStoreState, 
  ChatActions, 
  ChatSelectors,
  ChatInitParams,
  CreateChatRequest,
  SendMessageRequest,
  StreamEvent,
  ChatError
} from '../../_types/chat.types'

// =============================================================================
// 스토어 결합 타입
// =============================================================================

/**
 * 완전한 채팅 스토어 타입 (상태 + 액션 + 셀렉터)
 */
export interface ChatStore extends ChatStoreState, ChatActions, ChatSelectors {}

// =============================================================================
// 액션 매개변수 타입들
// =============================================================================

/**
 * 내부 액션용 세션 생성 파라미터
 */
export interface InternalCreateSessionParams extends CreateChatRequest {
  firstMessage?: string
}

/**
 * 메시지 전송 내부 파라미터
 */
export interface InternalSendMessageParams extends SendMessageRequest {
  sessionId?: string
  autoCreateSession?: boolean
}

/**
 * 스트리밍 핸들러 옵션
 */
export interface StreamHandlerOptions {
  onStart?: () => void
  onData?: (data: string) => void
  onEnd?: () => void
  onError?: (error: ChatError) => void
}

// =============================================================================
// 비동기 액션 결과 타입들
// =============================================================================

/**
 * 세션 생성 결과
 */
export interface CreateSessionResult {
  sessionId: string
  success: boolean
  error?: ChatError
}

/**
 * 메시지 전송 결과
 */
export interface SendMessageResult {
  messageId: string
  success: boolean
  isStreaming: boolean
  error?: ChatError
}

/**
 * 초기화 결과
 */
export interface InitializeResult {
  success: boolean
  sessionId?: string
  error?: ChatError
}

// =============================================================================
// 상태 업데이트 헬퍼 타입들
// =============================================================================

/**
 * 상태 부분 업데이트 타입
 */
export type PartialChatState = Partial<ChatStoreState>

/**
 * 메시지 업데이트 액션 타입
 */
export interface MessageUpdateAction {
  type: 'add' | 'update' | 'delete' | 'clear'
  messageId?: string
  sessionId?: string
  content?: string
  status?: 'pending' | 'streaming' | 'completed' | 'error'
}

/**
 * 세션 업데이트 액션 타입
 */
export interface SessionUpdateAction {
  type: 'add' | 'update' | 'delete' | 'clear'
  sessionId?: string
  updates?: Partial<ChatStoreState['sessions'][0]>
}

// =============================================================================
// 내부 유틸리티 타입들
// =============================================================================

/**
 * 스토어 액션 실행 컨텍스트
 */
export interface ActionContext {
  get: () => ChatStoreState
  set: (fn: (state: ChatStoreState) => PartialChatState) => void
}

/**
 * 비동기 액션 래퍼
 */
export type AsyncAction<P = void, R = void> = (params: P) => Promise<R>

/**
 * 동기 액션 래퍼
 */
export type SyncAction<P = void, R = void> = (params: P) => R

// =============================================================================
// 스토어 설정 타입들
// =============================================================================

/**
 * 스토어 미들웨어 옵션
 */
export interface StoreMiddlewareOptions {
  enableDevtools?: boolean
  enablePersist?: boolean
  persistKey?: string
  version?: number
}

/**
 * 스토어 초기 상태
 */
export interface InitialStoreState extends Partial<ChatStoreState> {
  // 필수 초기값들만 명시적으로 정의
  initMode: null
  isInitialized: false
  isLoading: false
  sessions: []
  currentSessionId: null
  messages: []
  currentSpreadSheetId: null
  fileInfo: null
  isStreaming: false
  isInputDisabled: false
  error: null
}

// =============================================================================
// 타입 가드 및 유틸리티
// =============================================================================

/**
 * 액션 결과 타입 가드
 */
export const isSuccessResult = <T extends { success: boolean }>(result: T): result is T & { success: true } => {
  return result.success === true
}

export const isErrorResult = <T extends { success: boolean; error?: ChatError }>(
  result: T
): result is T & { success: false; error: ChatError } => {
  return result.success === false && !!result.error
}

/**
 * 스토어 상태 타입 가드
 */
export const hasCurrentSession = (state: ChatStoreState): state is ChatStoreState & { 
  currentSessionId: string 
} => {
  return state.currentSessionId !== null
}

export const hasMessages = (state: ChatStoreState): state is ChatStoreState & { 
  messages: ChatStoreState['messages'] 
} => {
  return state.messages.length > 0
}

export const isStreamingActive = (state: ChatStoreState): boolean => {
  return state.isStreaming || state.messages.some(msg => msg.status === 'streaming')
}

// =============================================================================
// 상수 및 기본값
// =============================================================================

/**
 * 스토어 상수들
 */
export const STORE_CONSTANTS = {
  PERSIST_KEY: 'extion-chat-store',
  VERSION: 1,
  DEFAULT_SESSION_TITLE: '새로운 채팅',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  STREAM_TIMEOUT: 30000
} as const

/**
 * 초기 상태 생성 헬퍼
 */
export const createInitialState = (): InitialStoreState => ({
  initMode: null,
  isInitialized: false,
  isLoading: false,
  sessions: [],
  currentSessionId: null,
  messages: [],
  currentSpreadSheetId: null,
  fileInfo: null,
  isStreaming: false,
  isInputDisabled: false,
  reasoningPreview: null,
  reasoningComplete: false,
  error: null
})

// =============================================================================
// 액션 타입 열거형
// =============================================================================

/**
 * 스토어 액션 타입들
 */
export enum StoreActionType {
  // 초기화
  INITIALIZE = 'INITIALIZE',
  RESET = 'RESET',
  
  // 세션 관리
  CREATE_SESSION = 'CREATE_SESSION',
  LOAD_SESSIONS = 'LOAD_SESSIONS',
  SWITCH_SESSION = 'SWITCH_SESSION',
  DELETE_SESSION = 'DELETE_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',
  
  // 메시지 관리
  SEND_MESSAGE = 'SEND_MESSAGE',
  LOAD_MESSAGES = 'LOAD_MESSAGES',
  ADD_MESSAGE = 'ADD_MESSAGE',
  UPDATE_MESSAGE = 'UPDATE_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
  
  // 스트리밍
  START_STREAMING = 'START_STREAMING',
  STREAM_DATA = 'STREAM_DATA',
  END_STREAMING = 'END_STREAMING',
  STREAM_ERROR = 'STREAM_ERROR',
  
  // UI 상태
  SET_LOADING = 'SET_LOADING',
  SET_INPUT_DISABLED = 'SET_INPUT_DISABLED',
  
  // 오류 처리
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR'
}

// =============================================================================
// 디버깅 및 개발 도구 타입들
// =============================================================================

/**
 * 개발 도구용 액션 로그
 */
export interface ActionLog {
  type: StoreActionType
  timestamp: string
  payload?: any
  previousState?: Partial<ChatStoreState>
  nextState?: Partial<ChatStoreState>
  duration?: number
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  actionCounts: Record<StoreActionType, number>
  averageActionDuration: Record<StoreActionType, number>
  errorCounts: Record<string, number>
  lastActionTime: string
}