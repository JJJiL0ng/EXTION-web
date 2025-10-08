// 백엔드 DTO 검증에 맞는 유틸리티 함수들

/**
 * UUID v4 형식 검증
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
};

/**
 * 파일명 검증 (백엔드 DTO 규칙에 맞춤)
 */
export const isValidFileName = (fileName: string): boolean => {
  // 길이 검증 (1-255자)
  if (fileName.length < 1 || fileName.length > 255) {
    return false;
  }
  
  // 금지된 문자 검사
  const forbiddenChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
  for (const char of forbiddenChars) {
    if (fileName.includes(char)) {
      return false;
    }
  }
  
  // 제어 문자 검사 (0x00-0x1f)
  for (let i = 0; i < fileName.length; i++) {
    const charCode = fileName.charCodeAt(i);
    if (charCode >= 0 && charCode <= 31) {
      return false;
    }
  }
  
  return true;
};

/**
 * 셀 주소 검증 (A1, B2, AA10 등)
 */
export const isValidCellAddress = (cellAddress: string): boolean => {
  const cellAddressRegex = /^[A-Z]+[0-9]+$/;
  return cellAddressRegex.test(cellAddress);
};

/**
 * 범위 검증 (A1:B5, C1:D10 등)
 */
export const isValidRange = (range: string): boolean => {
  const rangeRegex = /^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/;
  return rangeRegex.test(range);
};

/**
 * HEX 색상 코드 검증
 */
export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(color);
};

/**
 * 수식 검증 (= 기호로 시작)
 */
export const isValidFormula = (formula: string): boolean => {
  const formulaRegex = /^=.+/;
  return formulaRegex.test(formula);
};

/**
 * 스프레드시트 생성 요청 검증
 */
export const validateCreateSpreadSheetRequest = (request: {
  fileName: string;
  spreadsheetId: string;
  chatId: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 파일명 검증
  if (!isValidFileName(request.fileName)) {
    errors.push('파일명이 올바르지 않습니다. (1-255자, 특수문자 제한)');
  }

  // spreadsheetId UUID 검증
  if (!isValidUUID(request.spreadsheetId)) {
    errors.push('스프레드시트 ID가 올바른 UUID 형식이 아닙니다.');
  }

  // chatId UUID 검증
  if (!isValidUUID(request.chatId)) {
    errors.push('채팅 ID가 올바른 UUID 형식이 아닙니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * UUID v4 생성
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
