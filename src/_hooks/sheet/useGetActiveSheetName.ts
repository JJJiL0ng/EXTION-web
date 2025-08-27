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
    const spread = spreadRef?.current;
    if (!spread) return;

    // 초기 시트명 설정
    updateActiveSheetName();

    // 활성화/탭 클릭/시트명 변경 시 업데이트
    const handleSheetActivated = () => updateActiveSheetName();
    const handleSheetRenamed = () => updateActiveSheetName();

    try {
      spread.bind('ActiveSheetChanged', handleSheetActivated);
      spread.bind('SheetTabClick', handleSheetActivated);
      // 시트 이름이 변경될 때도 최신 이름을 반영
      spread.bind('SheetNameChanged', handleSheetRenamed);
    } catch (error) {
      console.warn('Failed to bind sheet change events:', error);
    }

    return () => {
      try {
        spread.unbind('ActiveSheetChanged', handleSheetActivated);
        spread.unbind('SheetTabClick', handleSheetActivated);
        spread.unbind('SheetNameChanged', handleSheetRenamed);
      } catch (error) {
        console.warn('Failed to unbind sheet change events:', error);
      }
    };
  }, [spreadRef, updateActiveSheetName]);

  // ref가 늦게 준비되는 경우를 대비한 폴백: 최초 마운트 후 짧게 폴링하여 값 세팅
  useEffect(() => {
    if (activeSheetName) return; // 이미 세팅되었으면 스킵
    if (!spreadRef) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (spreadRef.current) {
        updateActiveSheetName();
        clearInterval(timer);
      }
      if (tries > 20) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [spreadRef, activeSheetName, updateActiveSheetName]);

  return { 
    getActiveSheetName, 
    activeSheetName,
    updateActiveSheetName 
  };
};
