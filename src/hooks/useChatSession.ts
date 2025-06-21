import { useEffect, useRef } from 'react';
import { useUnifiedStore } from '@/stores';

export const useChatSession = () => {
  const prevChatIdRef = useRef<string | null>(null);
  const {
    currentChatId,
    saveCurrentSessionToStore,
    loadChatSessionsFromStorage
  } = useUnifiedStore();

  // 채팅 세션 관리 Effect
  useEffect(() => {
    // 컴포넌트 마운트 시 저장된 채팅 세션들 로드
    loadChatSessionsFromStorage();
  }, [loadChatSessionsFromStorage]);

  // 채팅 ID 변경 시 세션 저장 Effect
  useEffect(() => {
    // 현재 채팅 ID가 변경되었을 때 이전 세션 저장
    if (prevChatIdRef.current && prevChatIdRef.current !== currentChatId) {
      saveCurrentSessionToStore();
    }
    
    // 현재 채팅 ID를 ref에 저장
    prevChatIdRef.current = currentChatId;
    
    return () => {
      // 컴포넌트 언마운트 시 현재 세션 저장
      if (currentChatId) {
        saveCurrentSessionToStore();
      }
    };
  }, [currentChatId, saveCurrentSessionToStore]);

  // 주기적 세션 저장 Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // 5분마다 현재 세션을 자동 저장
      if (currentChatId) {
        saveCurrentSessionToStore();
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [currentChatId, saveCurrentSessionToStore]);

  return {
    // 필요한 경우 추가 기능을 여기서 반환할 수 있습니다
  };
}; 