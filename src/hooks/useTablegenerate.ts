import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  processTableGeneration,
  ProcessChatRequest,
  ProcessChatResponse,
} from '@/services/api/tablegenerateService';
import { useUnifiedDataStore } from '@/stores/useUnifiedDataStore';

// useTablegenerate 훅의 반환 타입 정의
export interface UseTableGenerateReturn {
  generateTable: (
    params: Omit<ProcessChatRequest, 'chatId' | 'files'> & { files: File[] }
  ) => Promise<ProcessChatResponse | undefined>;
}

/**
 * 테이블 생성을 위한 API 호출을 처리하는 커스텀 훅 (Zustand 스토어 사용)
 */
const useTableGenerate = (): UseTableGenerateReturn => {
  const {
    startGeneration,
    setGenerationSuccess,
    setGenerationError,
    setProgress,
  } = useUnifiedDataStore();

  const generateTable = useCallback(
    async (
      params: Omit<ProcessChatRequest, 'chatId' | 'files'> & { files: File[] }
    ): Promise<ProcessChatResponse | undefined> => {
      startGeneration();

      const chatId = uuidv4();

      try {
        const request: ProcessChatRequest = {
          ...params,
          chatId,
        };
        
        const response = await processTableGeneration(request, (progressEvent) => {
          setProgress(progressEvent);
        });

        if (response.success) {
          setGenerationSuccess(response);
        } else {
          setGenerationError(response.error || '테이블 생성에 실패했습니다.');
        }
        
        return response;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
        setGenerationError(errorMessage);
        
        return {
          chatId,
          success: false,
          error: errorMessage,
        };
      }
    },
    [startGeneration, setGenerationSuccess, setGenerationError, setProgress]
  );

  return { generateTable };
};

export default useTableGenerate;
