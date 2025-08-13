import { useCallback } from 'react';
import useChatModeStore, { ChatMode } from '../../_store/userSetting/chatModeStore';

/**
 * ChatMode 관련 상태와 액션을 제공하는 커스텀 훅
 */
export const useChatMode = () => {
  // Store에서 상태와 액션들 가져오기
  const {
    chatId,
    mode,
    setChatId,
    resetChatId,
    setMode,
    resetSettings
  } = useChatModeStore();

  // 채팅 모드 토글 함수
  const toggleMode = useCallback(() => {
    setMode(mode === 'agent' ? 'edit' : 'agent');
  }, [mode, setMode]);

  // 에이전트 모드인지 확인
  const isAgentMode = mode === 'agent';
  
  // 에디트 모드인지 확인
  const isEditMode = mode === 'edit';

  // 새로운 채팅 세션 시작
  const startNewChatSession = useCallback((newChatId: string) => {
    setChatId(newChatId);
  }, [setChatId]);

  // 채팅 세션 종료
  const endChatSession = useCallback(() => {
    resetChatId();
  }, [resetChatId]);

  // 모든 설정 초기화
  const resetAllSettings = useCallback(() => {
    resetSettings();
  }, [resetSettings]);

  return {
    // 상태
    chatId,
    mode,
    isAgentMode,
    isEditMode,
    
    // 액션
    setMode,
    toggleMode,
    setChatId,
    resetChatId,
    startNewChatSession,
    endChatSession,
    resetAllSettings,
  };
};

export default useChatMode;
export type { ChatMode };