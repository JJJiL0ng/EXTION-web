import { useCallback } from 'react';
import useActiveSheetStore from '@/_store/sheet/activeSheetName';

/**
 * 활성 시트 상태를 관리하는 커스텀 훅
 * activeSheetName과 activeSheetIndex를 편리하게 사용할 수 있도록 제공
 */
export const useActiveSheetHook = () => {
  const {
    activeSheetName,
    activeSheetIndex,
    setActiveSheetName,
    setActiveSheetIndex,
    setActiveSheet,
    resetActiveSheet,
  } = useActiveSheetStore();

  // 시트 이름 변경 핸들러
  const handleSheetNameChange = useCallback((name: string) => {
    setActiveSheetName(name);
  }, [setActiveSheetName]);

  // 시트 인덱스 변경 핸들러
  const handleSheetIndexChange = useCallback((index: number) => {
    setActiveSheetIndex(index);
  }, [setActiveSheetIndex]);

  // 시트 이름과 인덱스 동시 변경 핸들러
  const handleActiveSheetChange = useCallback((name: string, index: number) => {
    setActiveSheet(name, index);
  }, [setActiveSheet]);

  // 시트 상태 초기화 핸들러
  const handleResetActiveSheet = useCallback(() => {
    resetActiveSheet();
  }, [resetActiveSheet]);

  // 현재 활성 시트 정보 객체
  const currentActiveSheet = {
    name: activeSheetName,
    index: activeSheetIndex,
  };

  // 활성 시트가 설정되어 있는지 확인
  const hasActiveSheet = activeSheetName.length > 0;

  return {
    // 상태값
    activeSheetName,
    activeSheetIndex,
    currentActiveSheet,
    hasActiveSheet,
    
    // 액션 함수들
    handleSheetNameChange,
    handleSheetIndexChange,
    handleActiveSheetChange,
    handleResetActiveSheet,
    
    // 원본 액션 함수들 (필요시 직접 사용)
    setActiveSheetName,
    setActiveSheetIndex,
    setActiveSheet,
    resetActiveSheet,
  };
};

export default useActiveSheetHook;