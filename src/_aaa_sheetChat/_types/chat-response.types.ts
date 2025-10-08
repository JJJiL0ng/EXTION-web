// src/types/chat-response.types.ts

// 인텐트 타입 열거형
export enum ChatIntentType {
  EXCEL_FORMULA = 'excel_formula',
  PYTHON_CODE_GENERATOR = 'python_code_generator',
  WHOLE_DATA = 'whole_data',
  GENERAL_HELP = 'general_help'
}

// 기본 응답 인터페이스
export interface BaseChatResponse {
  chatId: string;
  timestamp: string;
  intent: string;
  message: string;
  userId?: string;
}

// 엑셀 공식 파라미터 인터페이스
export interface FormulaParameter {
  name: string;
  description: string;
  required: boolean;
}

// 엑셀 공식 예제 인터페이스
export interface FormulaExample {
  code: string;
  description: string;
}

// 엑셀 공식 상세 정보 인터페이스
export interface FormulaDetails {
  name: string;
  description: string;
  syntax: string;
  parameters: FormulaParameter[];
  examples: FormulaExample[];
}

// 코드 구현 인터페이스
export interface Implementation {
  code: string;
  explanation: string;
}

// 엑셀 공식 관련 응답 인터페이스
export interface ExcelFormulaResponse extends BaseChatResponse {
  intent: ChatIntentType.EXCEL_FORMULA;
  formulaDetails: FormulaDetails;
  implementation?: Implementation;
}

// 시각화 인터페이스
export interface Visualization {
  type: string;
  code: string;
  description: string;
}

// 파이썬 코드 생성 인터페이스
export interface CodeGenerator {
  pythonCode: string;
  explanation: string;
  importedLibraries: string[];
  visualizations?: Visualization[];
}

// 파이썬 코드 생성기 응답 인터페이스
export interface PythonCodeGeneratorResponse extends BaseChatResponse {
  intent: ChatIntentType.PYTHON_CODE_GENERATOR;
  codeGenerator: CodeGenerator;
}

// 데이터 변환 인터페이스
export interface DataTransformation {
  transformationMethod: string;
  processingSteps: string;
  validationMethod?: string;
  dataUsageTips?: string[];
}

// 전체 데이터 분석 결과 인터페이스
export interface WholeDataAnalysis {
  response: string;
}

// 전체 데이터 관련 응답 인터페이스
export interface WholeDataResponse extends BaseChatResponse {
  intent: ChatIntentType.WHOLE_DATA;
  dataTransformation: DataTransformation;
  answerAfterReadWholedata?: string | WholeDataAnalysis; // 백엔드에서 전체 데이터 분석 후 제공하는 답변 (문자열 또는 객체)
  answerAfterReadWholeData?: string | WholeDataAnalysis; // 대소문자 다른 버전도 지원
}

// 일반 도움말 예제 인터페이스
export interface HelpExample {
  scenario: string;
  solution: string;
}

// 일반 도움말 추가 자료 인터페이스
export interface AdditionalResource {
  title: string;
  description: string;
  link?: string;
}

// 일반 도움말 상세 인터페이스
export interface GeneralHelpDetails {
  directAnswer: string;
  relatedFeatures?: string[];
  examples?: HelpExample[];
  additionalResources?: AdditionalResource[];
}

// 일반 도움말 응답 인터페이스
export interface GeneralHelpResponse extends BaseChatResponse {
  intent: ChatIntentType.GENERAL_HELP;
  generalHelp: GeneralHelpDetails;
}

// 응답 타입에 따른 유니온 타입
export type ChatResponseDto = 
  | ExcelFormulaResponse 
  | PythonCodeGeneratorResponse 
  | WholeDataResponse 
  | GeneralHelpResponse;

// 타입 가드 함수들
export const isExcelFormulaResponse = (response: ChatResponseDto): response is ExcelFormulaResponse => {
  return response.intent === ChatIntentType.EXCEL_FORMULA;
};

export const isPythonCodeGeneratorResponse = (response: ChatResponseDto): response is PythonCodeGeneratorResponse => {
  return response.intent === ChatIntentType.PYTHON_CODE_GENERATOR;
};

export const isWholeDataResponse = (response: ChatResponseDto): response is WholeDataResponse => {
  return response.intent === ChatIntentType.WHOLE_DATA;
};

export const isGeneralHelpResponse = (response: ChatResponseDto): response is GeneralHelpResponse => {
  return response.intent === ChatIntentType.GENERAL_HELP;
};

// 응답 팩토리 클래스
export class ChatResponseFactory {
  static createResponse(intent: string): BaseChatResponse {
    const baseResponse: BaseChatResponse = {
      chatId: '',
      timestamp: new Date().toISOString(),
      intent,
      message: '',
    };

    switch (intent) {
      case ChatIntentType.EXCEL_FORMULA:
        return {
          ...baseResponse,
          intent: ChatIntentType.EXCEL_FORMULA,
          formulaDetails: {
            name: '',
            description: '',
            syntax: '',
            parameters: [],
            examples: []
          }
        } as ExcelFormulaResponse;
        
      case ChatIntentType.PYTHON_CODE_GENERATOR:
        return {
          ...baseResponse,
          intent: ChatIntentType.PYTHON_CODE_GENERATOR,
          codeGenerator: {
            pythonCode: '',
            explanation: '',
            importedLibraries: []
          }
        } as PythonCodeGeneratorResponse;
        
      case ChatIntentType.WHOLE_DATA:
        return {
          ...baseResponse,
          intent: ChatIntentType.WHOLE_DATA,
          dataTransformation: {
            transformationMethod: '',
            processingSteps: ''
          }
        } as WholeDataResponse;
        
      case ChatIntentType.GENERAL_HELP:
        return {
          ...baseResponse,
          intent: ChatIntentType.GENERAL_HELP,
          generalHelp: {
            directAnswer: ''
          }
        } as GeneralHelpResponse;
        
      default:
        return baseResponse;
    }
  }
}

// 유틸리티 타입들
export interface ChatMessage {
  id: string;
  chatId: string;
  content: ChatResponseDto;
  timestamp: string;
  isUser: boolean;
}

export interface ChatSession {
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

// API 응답 래퍼 타입들
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 에러 타입들
export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export enum ChatErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  STREAM_ERROR = 'STREAM_ERROR'
}

// SSE 이벤트 타입들
export interface SSEMessage {
  type: 'data' | 'error' | 'end';
  content: ChatResponseDto | ChatError | null;
}

// 채팅 상태 타입들
export enum ChatStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  STREAMING = 'streaming',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export interface ChatState {
  status: ChatStatus;
  currentChatId?: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error?: ChatError;
}

// 설정 타입들
export interface ChatConfig {
  apiBaseUrl: string;
  maxRetries: number;
  retryDelay: number;
  streamTimeout: number;
  maxMessageLength: number;
}

// 메타데이터 타입들
export interface ChatMetadata {
  userAgent: string;
  sessionId: string;
  clientVersion: string;
  timestamp: string;
  locale?: string;
  timezone?: string;
}

// 통계 타입들
export interface ChatStatistics {
  totalMessages: number;
  averageResponseTime: number;
  errorRate: number;
  popularIntents: Array<{
    intent: ChatIntentType;
    count: number;
    percentage: number;
  }>;
}

// 내보내기를 위한 기본 타입들 재정의 (호환성)
export type ExcelFormulaResponseDto = ExcelFormulaResponse;
export type PythonCodeGeneratorResponseDto = PythonCodeGeneratorResponse;
export type WholeDataResponseDto = WholeDataResponse;
export type GeneralHelpResponseDto = GeneralHelpResponse;
export type BaseChatResponseDto = BaseChatResponse;