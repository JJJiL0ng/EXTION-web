import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * SpreadSheet ID를 생성하는 커스텀 훅
 * UUID v4를 사용하여 고유한 SpreadSheet ID를 생성합니다.
 */
export const useGenerateSpreadSheetId = () => {
  /**
   * 새로운 SpreadSheet ID를 생성합니다
   * @returns {string} 생성된 SpreadSheet ID (형식: spreadsheet_uuid)
   */
  const generateSpreadSheetId = useCallback(() => {
    const uuid = uuidv4();
    return `spreadsheet_${uuid}`;
  }, []);

  return {
    generateSpreadSheetId
  };
};

export default useGenerateSpreadSheetId;
