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

  /**
   * 짧은 형태의 SpreadSheet ID를 생성합니다 (8자리)
   * @returns {string} 생성된 짧은 SpreadSheet ID (형식: sheet_8자리)
   */
  const generateShortSpreadSheetId = useCallback(() => {
    const uuid = uuidv4();
    const shortId = uuid.replace(/-/g, '').substring(0, 8);
    return `sheet_${shortId}`;
  }, []);

  /**
   * 타임스탬프와 함께 SpreadSheet ID를 생성합니다
   * @returns {string} 생성된 SpreadSheet ID (형식: spreadsheet_timestamp_uuid)
   */
  const generateTimestampedSpreadSheetId = useCallback(() => {
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `spreadsheet_${timestamp}_${uuid}`;
  }, []);

  /**
   * 사용자 ID와 함께 SpreadSheet ID를 생성합니다
   * @param {string} userId - 사용자 ID
   * @returns {string} 생성된 SpreadSheet ID (형식: spreadsheet_userId_uuid)
   */
  const generateUserSpreadSheetId = useCallback((userId: string) => {
    const uuid = uuidv4();
    return `spreadsheet_${userId}_${uuid}`;
  }, []);

  return {
    generateSpreadSheetId,
    generateShortSpreadSheetId,
    generateTimestampedSpreadSheetId,
    generateUserSpreadSheetId,
  };
};

export default useGenerateSpreadSheetId;
