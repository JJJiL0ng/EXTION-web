export type ChatMode = 'normal' | 'artifact' | 'datafix' | 'dataedit' | 'data-edit' | 'edit-chat' | 'function' | 'function-chat' | 'datageneration' | 'general' | 'data-generate' | 'visualization';

export interface LoadingHints {
  readonly hints: readonly string[];
}

export const LOADING_HINTS: LoadingHints = {
  hints: [
    "데이터를 분석하고 있습니다...",
    "패턴을 찾고 있어요...",
    "최적의 응답을 만들고 있습니다...",
    "결과를 정리하는 중입니다...",
    "데이터의 연관성을 파악하고 있어요...",
    "통계적 의미를 분석 중입니다...",
    "최상의 답변을 구성하고 있습니다..."
  ]
} as const;

export interface ChatLoadingState {
  isLoading: boolean;
  loadingProgress: number;
  loadingHintIndex: number;
}

export interface FileProcessingState {
  isDragOver: boolean;
  isProcessing: boolean;
}

export interface ChatInputState {
  inputValue: string;
  isComposing: boolean;
}

export interface AppliedActionsState {
  appliedDataFixes: string[];
  appliedFunctionResults: string[];
} 