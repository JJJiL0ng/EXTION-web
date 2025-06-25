import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMode, ChatLoadingState, ChatInputState, AppliedActionsState, LOADING_HINTS } from '@/types/chat';

type TimeoutHandle = ReturnType<typeof setTimeout>;

export const useChatState = () => {
  const [currentMode, setCurrentMode] = useState<ChatMode>('general');
  const [loadingState, setLoadingState] = useState<ChatLoadingState>({
    isLoading: false,
    loadingProgress: 0,
    loadingHintIndex: 0
  });
  const [inputState, setInputState] = useState<ChatInputState>({
    inputValue: '',
    isComposing: false
  });
  const [appliedActions, setAppliedActions] = useState<AppliedActionsState>({
    appliedDataFixes: [],
    appliedFunctionResults: []
  });

  const loadingIntervalRef = useRef<TimeoutHandle | null>(null);

  // 로딩 상태 관리
  useEffect(() => {
    if (loadingState.isLoading) {
      setLoadingState(prev => ({ ...prev, loadingHintIndex: 0 }));

      loadingIntervalRef.current = setInterval(() => {
        setLoadingState(prev => ({
          ...prev,
          loadingProgress: prev.loadingProgress < 90 
            ? prev.loadingProgress + Math.max(1, 10 - Math.floor(prev.loadingProgress / 10))
            : prev.loadingProgress,
          loadingHintIndex: (prev.loadingHintIndex + 1) % LOADING_HINTS.hints.length
        }));
      }, 2000);

      return () => {
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
          loadingIntervalRef.current = null;
        }
        setLoadingState(prev => ({ ...prev, loadingProgress: 100 }));
      };
    }
  }, [loadingState.isLoading]);

  // 로딩 시작/종료 함수
  const startLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, isLoading: true, loadingProgress: 0 }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, isLoading: false, loadingProgress: 100 }));
  }, []);

  // 입력 상태 관리 함수들
  const setInputValue = useCallback((value: string) => {
    setInputState(prev => ({ ...prev, inputValue: value }));
  }, []);

  const setIsComposing = useCallback((composing: boolean) => {
    setInputState(prev => ({ ...prev, isComposing: composing }));
  }, []);

  const clearInput = useCallback(() => {
    setInputState(prev => ({ ...prev, inputValue: '' }));
  }, []);

  // 적용된 액션 관리
  const addAppliedDataFix = useCallback((messageId: string) => {
    setAppliedActions(prev => ({
      ...prev,
      appliedDataFixes: [...prev.appliedDataFixes, messageId]
    }));
  }, []);

  const addAppliedFunctionResult = useCallback((messageId: string) => {
    setAppliedActions(prev => ({
      ...prev,
      appliedFunctionResults: [...prev.appliedFunctionResults, messageId]
    }));
  }, []);

  return {
    // 상태
    currentMode,
    loadingState,
    inputState,
    appliedActions,
    
    // 액션
    setCurrentMode,
    startLoading,
    stopLoading,
    setInputValue,
    setIsComposing,
    clearInput,
    addAppliedDataFix,
    addAppliedFunctionResult
  };
}; 