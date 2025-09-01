import { useCallback, useState, useEffect } from 'react';
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";

export const useGetActiveSheetName = () => {
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const { spread } = useSpreadsheetContext();

  const getActiveSheetName = useCallback(() => {
    if (!spread) return '';
    try {
      const sheet = spread.getActiveSheet?.();
      const name = sheet?.name?.();
      return typeof name === 'string' ? name : '';
    } catch (e) {
      console.warn('Failed to get active sheet name:', e);
      return '';
    }
  }, [spread]);

  // 실시간으로 활성 시트명을 추적
  const updateActiveSheetName = useCallback(() => {
    const sheetName = getActiveSheetName();
    setActiveSheetName(sheetName);
  }, [getActiveSheetName]);

  useEffect(() => {
    if (!spread) return;

    // 초기 시트명 설정
    updateActiveSheetName();

    // 활성화/탭 클릭/시트명 변경 시 업데이트
    const handleSheetActivated = () => updateActiveSheetName();
    const handleSheetRenamed = () => updateActiveSheetName();

    try {
      spread.bind?.('ActiveSheetChanged', handleSheetActivated);
      spread.bind?.('SheetTabClick', handleSheetActivated);
      // 시트 이름이 변경될 때도 최신 이름을 반영
      spread.bind?.('SheetNameChanged', handleSheetRenamed);
    } catch (error) {
      console.warn('Failed to bind sheet change events:', error);
    }

    return () => {
      try {
        spread.unbind?.('ActiveSheetChanged', handleSheetActivated);
        spread.unbind?.('SheetTabClick', handleSheetActivated);
        spread.unbind?.('SheetNameChanged', handleSheetRenamed);
      } catch (error) {
        console.warn('Failed to unbind sheet change events:', error);
      }
    };
  }, [spread, updateActiveSheetName]);

  // 폴백: 초기에 이름이 비어 있고 spread가 준비되어 있으면 짧게 폴링하여 값 세팅
  useEffect(() => {
    if (activeSheetName || !spread) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const name = getActiveSheetName();
      if (name) {
        setActiveSheetName(name);
        clearInterval(timer);
      }
      if (tries > 20) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [spread, activeSheetName, getActiveSheetName]);

  return {
    getActiveSheetName,
    activeSheetName,
    updateActiveSheetName,
  };
};
