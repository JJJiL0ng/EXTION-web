// src/_types/chat.types.ts
// v2 채팅 시스템 핵심 타입 정의

import { ChatResponseDto } from './chat-response.types'

// =============================================================================
// 초기화 모드 관련 타입
// =============================================================================

/**
 * 채팅 초기화 모드
 */
export enum ChatInitMode {
  BLANK_SHEET = 'blank_sheet',      // 빈 시트에서 시작
  FILE_UPLOAD = 'file_upload',      // 파일 업로드 시작
  EXISTING_CHAT = 'existing_chat'   // 기존 채팅 불러오기
}

/**
 * 파일 업로드 정보
 */
export interface UploadedFileInfo {
  fileName: string
  fileSize: number
  fileType: string
  spreadSheetId: string
  uploadedAt: string
}

/**
 * 초기화 파라미터
 */
export interface ChatInitParams {
  mode: ChatInitMode
  fileInfo?: UploadedFileInfo
  existingChatId?: string
  spreadSheetId?: string
}

// =============================================================================
// 채팅 메시지 관련 타입
// =============================================================================

/**
 * 메시지 타입
 */
export enum MessageType {
  USER = 'user',           // 사용자 메시지
  ASSISTANT = 'assistant', // AI 응답 메시지
  SYSTEM = 'system'        // 시스템 메시지
}

/**
 * 메시지 상태
 */
export enum MessageStatus {
  PENDING = 'pending',     // 전송 중
  STREAMING = 'streaming', // 스트리밍 중
  COMPLETED = 'completed', // 완료
  ERROR = 'error'          // 오류
}

/**
 * 기본 메시지 인터페이스
 */
export interface BaseMessage {
  id: string
  chatId: string
  type: MessageType
  content: string
  status: MessageStatus
  timestamp: string
  userId?: string
}

/**
 * 사용자 메시지
 */
export interface UserMessage extends BaseMessage {
  type: MessageType.USER
  status: MessageStatus.COMPLETED
}

/**
 * AI 응답 메시지 (구조화된 응답 포함)
 */
export interface AssistantMessage extends BaseMessage {
  type: MessageType.ASSISTANT
  structuredContent?: ChatResponseDto // 기존 응답 구조 재사용
  streamingContent?: string // 스트리밍 중 임시 콘텐츠
}

/**
 * 시스템 메시지
 */
export interface SystemMessage extends BaseMessage {
  type: MessageType.SYSTEM
  systemType: 'welcome' | 'error' | 'info' | 'warning'
}

/**
 * 통합 메시지 타입
 */
export type ChatMessage = UserMessage | AssistantMessage | SystemMessage

// =============================================================================
// 채팅 세션 관련 타입
// =============================================================================

/**
 * 채팅 세션 상태
 */
export enum ChatSessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

/**
 * 채팅 세션
 */
export interface ChatSession {
  id: string
  title: string
  spreadSheetId?: string
  status: ChatSessionStatus
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
  messageCount: number
  lastMessage?: string
  metadata?: ChatSessionMetadata
}

/**
 * 채팅 세션 메타데이터
 */
export interface ChatSessionMetadata {
  initMode: ChatInitMode
  fileInfo?: UploadedFileInfo
  tags?: string[]
  isStarred?: boolean
  customTitle?: string
}

// =============================================================================
// 채팅 상태 관리 타입
// =============================================================================

/**
 * 채팅 스토어 상태
 */
export interface ChatStoreState {
  // 초기화 관련
  initMode: ChatInitMode | null
  isInitialized: boolean
  isLoading: boolean
  
  // 세션 관리
  sessions: ChatSession[]
  currentSessionId: string | null
  
  // 메시지 관리
  messages: ChatMessage[]
  
  // 스프레드시트 연동
  currentSpreadSheetId: string | null
  
  // 파일 업로드
  fileInfo: UploadedFileInfo | null
  
  // UI 상태
  isStreaming: boolean
  isInputDisabled: boolean
  
  // Reasoning Preview 상태
  reasoningPreview: string | null
  reasoningComplete: boolean
  
  // 오류 처리
  error: ChatError | null
}

/**
 * 채팅 오류
 */
export interface ChatError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  recoverable: boolean
}

// =============================================================================
// API 관련 타입
// =============================================================================

/**
 * 메시지 전송 요청
 */
export interface SendMessageRequest {
  chatId: string
  content: string
  spreadSheetId: string
  metadata?: Record<string, any>
}

/**
 * 메시지 전송 응답
 */
export interface SendMessageResponse {
  messageId: string
  chatId: string
  status: 'accepted' | 'rejected'
  streamUrl?: string
}

/**
 * 채팅 생성 요청
 */
export interface CreateChatRequest {
  title?: string
  spreadSheetId?: string
  initMode: ChatInitMode
  fileInfo?: UploadedFileInfo
}

/**
 * 채팅 생성 응답
 */
export interface CreateChatResponse {
  chatId: string
  title: string
  createdAt: string
}

/**
 * 채팅 목록 조회 응답
 */
export interface LoadChatsResponse {
  sessions: ChatSession[]
  totalCount: number
  hasMore: boolean
}

/**
 * 메시지 목록 조회 응답
 */
export interface LoadMessagesResponse {
  messages: ChatMessage[]
  totalCount: number
  hasMore: boolean
}

// =============================================================================
// 스트리밍 관련 타입
// =============================================================================

/**
 * 스트리밍 이벤트 타입
 */
export enum StreamEventType {
  START = 'start',
  DATA = 'data',
  END = 'end',
  ERROR = 'error'
}

/**
 * 스트리밍 이벤트
 */
export interface StreamEvent {
  type: StreamEventType
  data?: string
  error?: ChatError
  messageId?: string
}

// =============================================================================
// 유틸리티 타입
// =============================================================================

/**
 * 채팅 액션 타입
 */
export type ChatActions = {
  // 초기화
  initialize: (params: ChatInitParams) => Promise<void>
  reset: () => void
  
  // 세션 관리
  createSession: (request: CreateChatRequest) => Promise<string>
  loadSessions: () => Promise<void>
  switchSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  
  // 메시지 관리
  sendMessage: (content: string) => Promise<void>
  loadMessages: (sessionId: string) => Promise<void>
  
  // 스트리밍
  handleStreamEvent: (event: StreamEvent) => void
  
  // 오류 처리
  setError: (error: ChatError | null) => void
  clearError: () => void
}

/**
 * 채팅 셀렉터 타입
 */
export type ChatSelectors = {
  // 상태 조회
  getInitMode: () => ChatInitMode | null
  getIsInitialized: () => boolean
  getIsLoading: () => boolean
  
  // 세션 조회
  getCurrentSession: () => ChatSession | null
  getSessionById: (id: string) => ChatSession | null
  getAllSessions: () => ChatSession[]
  
  // 메시지 조회
  getMessages: () => ChatMessage[]
  getMessagesBySessionId: (sessionId: string) => ChatMessage[]
  getLastMessage: () => ChatMessage | null
  
  // UI 상태 조회
  getCanSendMessage: () => boolean
  getAvailableActions: () => {
    canShowChatList: boolean
    canCreateNewChat: boolean
    canSwitchChat: boolean
    showWelcomeMessage: boolean
  }
  
  // 오류 조회
  getError: () => ChatError | null
  getHasError: () => boolean
  
  // Reasoning Preview 조회
  getReasoningPreview: () => string | null
  getReasoningComplete: () => boolean
  getHasReasoningPreview: () => boolean
}

// =============================================================================
// 타입 가드 함수들
// =============================================================================

export const isUserMessage = (message: ChatMessage): message is UserMessage => {
  return message.type === MessageType.USER
}

export const isAssistantMessage = (message: ChatMessage): message is AssistantMessage => {
  return message.type === MessageType.ASSISTANT
}

export const isSystemMessage = (message: ChatMessage): message is SystemMessage => {
  return message.type === MessageType.SYSTEM
}

export const isStreamingMessage = (message: ChatMessage): boolean => {
  return message.status === MessageStatus.STREAMING
}

export const isCompletedMessage = (message: ChatMessage): boolean => {
  return message.status === MessageStatus.COMPLETED
}

// =============================================================================
// 상수 정의
// =============================================================================

export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_SESSIONS: 50,
  DEFAULT_SESSION_TITLE: '새로운 채팅',
  STREAM_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const

// =============================================================================
// 레거시 호환성을 위한 타입 re-export
// =============================================================================

export type {
  ChatResponseDto,
  ChatIntentType,
  BaseChatResponse,
  ExcelFormulaResponse,
  PythonCodeGeneratorResponse,
  WholeDataResponse,
  GeneralHelpResponse
} from './chat-response.types'