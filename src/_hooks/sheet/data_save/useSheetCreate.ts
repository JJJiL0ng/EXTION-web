import { useState, useCallback } from 'react';
import {  createSpreadSheetApiConnector } from '@/_ApiConnector/sheet/createSpreadSheetApi';
import { CreateSpreadSheetReq, CreateSpreadSheetRes } from '@/_types/apiConnector/spreadsheet-create/spreadSheetCreateApi';
import { useSpreadSheetVersionStore } from '@/_store/sheet/spreadSheetVersionIdStore';

//todo
interface UseSheetCreateState {
  loading: boolean;
  error: string | null;
}

interface UseSheetCreateReturn {
  loading: boolean;
  error: string | null;
  createSheet: (data: CreateSpreadSheetReq) => Promise<CreateSpreadSheetRes | null>;
  reset: () => void;
}

export const useSheetCreate = (): UseSheetCreateReturn => {
  const [state, setState] = useState<UseSheetCreateState>({
    loading: false,
    error: null,
  });

  const createSheet = useCallback(async (data: CreateSpreadSheetReq): Promise<CreateSpreadSheetRes | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🚀 [useSheetCreate] 스프레드시트 생성 시작:', data);
      
      const result = await createSpreadSheetApiConnector(data);
      
      console.log('✅ [useSheetCreate] 스프레드시트 생성 성공:', result);
      setState(prev => ({ ...prev, loading: false }));
      useSpreadSheetVersionStore.setState({ spreadSheetVersionId: result.spreadSheetVersionId });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '스프레드시트 생성 중 오류가 발생했습니다.';
      
      console.error('❌ [useSheetCreate] 스프레드시트 생성 실패:', errorMessage);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
    });
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    createSheet,
    reset,
  };
};
