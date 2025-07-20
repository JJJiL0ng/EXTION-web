import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat ID를 생성하는 커스텀 훅
 * UUID v4를 사용하여 고유한 Chat ID를 생성합니다.
 */
export const useGenerateChatId = () => {
  /**
   * 새로운 Chat ID를 생성합니다
   * @returns {string} 생성된 Chat ID (형식: chat_uuid)
   */
  const generateChatId = useCallback(() => {
    const uuid = uuidv4();
    return `chat_${uuid}`;
  }, []);
  return {
    generateChatId
  };
};

export default useGenerateChatId;
