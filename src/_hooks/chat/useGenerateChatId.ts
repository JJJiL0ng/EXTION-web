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

  /**
   * 짧은 형태의 Chat ID를 생성합니다 (8자리)
   * @returns {string} 생성된 짧은 Chat ID (형식: chat_8자리)
   */
  const generateShortChatId = useCallback(() => {
    const uuid = uuidv4();
    const shortId = uuid.replace(/-/g, '').substring(0, 8);
    return `chat_${shortId}`;
  }, []);

  /**
   * 타임스탬프와 함께 Chat ID를 생성합니다
   * @returns {string} 생성된 Chat ID (형식: chat_timestamp_uuid)
   */
  const generateTimestampedChatId = useCallback(() => {
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `chat_${timestamp}_${uuid}`;
  }, []);

  /**
   * 사용자 ID와 함께 Chat ID를 생성합니다
   * @param {string} userId - 사용자 ID
   * @returns {string} 생성된 Chat ID (형식: chat_userId_uuid)
   */
  const generateUserChatId = useCallback((userId: string) => {
    const uuid = uuidv4();
    return `chat_${userId}_${uuid}`;
  }, []);

  return {
    generateChatId,
    generateShortChatId,
    generateTimestampedChatId,
    generateUserChatId,
  };
};

export default useGenerateChatId;
