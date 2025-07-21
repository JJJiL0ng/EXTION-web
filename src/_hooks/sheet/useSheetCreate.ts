import { useState, useCallback } from 'react';
import { SheetAPI, CreateSpreadSheetRequest, SpreadSheetData } from '../../_Api/sheet/sheetApi';
import { validateCreateSpreadSheetRequest } from '../../_utils/validationUtils';

interface UseSheetCreateState {
  isCreating: boolean;
  error: string | null;
  createdSheet: SpreadSheetData | null;
}

interface UseSheetCreateOptions {
  onSuccess?: (sheet: SpreadSheetData) => void;
  onError?: (error: Error) => void;
}

export const useSheetCreate = (options?: UseSheetCreateOptions) => {
  const [state, setState] = useState<UseSheetCreateState>({
    isCreating: false,
    error: null,
    createdSheet: null,
  });

  const createSheet = useCallback(async (request: CreateSpreadSheetRequest) => {
    // 백엔드 DTO 검증
    const validation = validateCreateSpreadSheetRequest(request);
    if (!validation.isValid) {
      const errorMessage = `입력 검증 실패: ${validation.errors.join(', ')}`;
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      options?.onError?.(new Error(errorMessage));
      throw new Error(errorMessage);
    }

    setState(prev => ({
      ...prev,
      isCreating: true,
      error: null,
    }));

    try {
      const response = await SheetAPI.createSpreadSheet(request);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          isCreating: false,
          createdSheet: response.data,
          error: null,
        }));
        
        options?.onSuccess?.(response.data);
        return response.data;
      } else {
        throw new Error(response.message || '스프레드시트 생성에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      setState(prev => ({
        ...prev,
        isCreating: false,
        error: errorMessage,
      }));
      
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [options]);

  const createSheetWithDefaults = useCallback(async (
    fileName: string,
    spreadSheetId: string,
    chatId: string,
    initialData: Record<string, any> = {}
  ) => {
    const request: CreateSpreadSheetRequest = {
      fileName,
      spreadsheetId: spreadSheetId, // 백엔드 형식에 맞게 변경
      chatId,
      initialData,
    };
    
    return createSheet(request);
  }, [createSheet]);

  const resetState = useCallback(() => {
    setState({
      isCreating: false,
      error: null,
      createdSheet: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    // State
    isCreating: state.isCreating,
    error: state.error,
    createdSheet: state.createdSheet,
    
    // Actions
    createSheet,
    createSheetWithDefaults,
    resetState,
    clearError,
  };
};

export default useSheetCreate;
