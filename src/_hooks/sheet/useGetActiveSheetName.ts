import { useCallback, useState, useEffect } from 'react';

interface UseGetSheetNamesProps {
  spreadRef: React.RefObject<any> | React.MutableRefObject<any> | null;
}

export const useGetActiveSheetName = ({ spreadRef }: UseGetSheetNamesProps) => {
  const [activeSheetName, setActiveSheetName] = useState<string>('');

  const getActiveSheetName = useCallback(() => {
    if (!spreadRef?.current) {
      console.log('SpreadRef is not available');
      return '';
    }
    var sheetName = spreadRef.current.getActiveSheet().name();
    console.log(sheetName);
    return sheetName;
  }, [spreadRef]);

  // 실시간으로 활성 시트명을 추적
  const updateActiveSheetName = useCallback(() => {
    const sheetName = getActiveSheetName();
    setActiveSheetName(sheetName);
  }, [getActiveSheetName]);

  useEffect(() => {
    if (!spreadRef?.current) return;

    // 초기 시트명 설정
    updateActiveSheetName();

    // SpreadJS의 시트 변경 이벤트 리스너 등록
    const spread = spreadRef.current;
    
    // 시트 활성화 이벤트 감지
    const handleSheetActivated = () => {
      updateActiveSheetName();
    };

    // 이벤트 리스너 등록 (SpreadJS의 실제 이벤트명에 따라 조정 필요)
    try {
      spread.bind('ActiveSheetChanged', handleSheetActivated);
      spread.bind('SheetTabClick', handleSheetActivated);
    } catch (error) {
      console.warn('Failed to bind sheet change events:', error);
    }

    // 클린업 함수
    return () => {
      try {
        spread.unbind('ActiveSheetChanged', handleSheetActivated);
        spread.unbind('SheetTabClick', handleSheetActivated);
      } catch (error) {
        console.warn('Failed to unbind sheet change events:', error);
      }
    };
  }, [spreadRef, updateActiveSheetName]);

  return { 
    getActiveSheetName, 
    activeSheetName,
    updateActiveSheetName 
  };
};
