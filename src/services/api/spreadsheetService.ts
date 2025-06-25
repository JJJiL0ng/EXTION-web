// 백엔드 Spreadsheet API 호출을 위한 서비스

export interface SheetTableData {
  name: string;
  index: number;
  data: any[][];
}

export interface SpreadsheetData {
  id: string;
  userId: string;
  chatId?: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex?: number;
  sheets: SheetTableData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpreadsheetDto {
  userId: string;
  chatId?: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex?: number;
  sheets: SheetTableData[];
}

export interface AutoSaveSpreadsheetDto {
  userId: string;
  spreadsheetId: string;
  sheets: SheetTableData[];
  activeSheetIndex?: number;
  isIncremental?: boolean;
}

export interface DeltaAutoSaveDto {
  userId: string;
  spreadsheetId: string;
  cellChanges?: Array<{
    sheetIndex: number;
    row: number;
    col: number;
    value: any;
    oldValue?: any;
  }>;
  metaChanges?: Array<{
    sheetIndex: number;
    name?: string;
    activeSheetIndex?: number;
  }>;
  newSheets?: any[];
  deletedSheets?: number[];
}

export interface AutoSaveStatusDto {
  userId: string;
  spreadsheetId: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 채팅 ID로 스프레드시트 데이터 로드
 */
export const getSpreadsheetDataByChatId = async (chatId: string): Promise<SpreadsheetData | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/data/loadsheet/${chatId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 채팅이나 스프레드시트를 찾을 수 없음
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      // 채팅은 있지만 연결된 스프레드시트가 없는 경우
      if (result.error === 'SHEET_NOT_FOUND') {
        console.warn('채팅에 연결된 스프레드시트가 없습니다:', chatId);
        return null;
      }
      throw new Error(result.message || '스프레드시트 로드에 실패했습니다.');
    }

    // 응답 데이터 구조 변환
    const { chatInfo, sheetMetaData, sheets } = result.data;
    
    // SpreadsheetData 형식으로 변환
    const data: SpreadsheetData = {
      id: sheetMetaData.id,
      userId: sheetMetaData.userId,
      chatId: chatInfo.id,
      fileName: sheetMetaData.fileName,
      originalFileName: sheetMetaData.originalFileName,
      fileSize: sheetMetaData.fileSize,
      fileType: sheetMetaData.fileType,
      activeSheetIndex: sheetMetaData.activeSheetIndex,
      sheets: sheets.map((sheet: any) => ({
        name: sheet.name,
        index: sheet.index,
        data: sheet.data
      })),
      createdAt: new Date(sheetMetaData.createdAt),
      updatedAt: new Date(sheetMetaData.updatedAt),
    };

    return data;
  } catch (error) {
    console.error('채팅 ID로 스프레드시트 데이터 로드 실패:', error);
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

/**
 * 스프레드시트 데이터 로드 (기존 함수 - 하위 호환성 유지)
 */
export const getSpreadsheetData = async (spreadsheetId: string): Promise<SpreadsheetData | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/data/load?id=${spreadsheetId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 스프레드시트를 찾을 수 없음
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '스프레드시트 로드에 실패했습니다.');
    }

    // Date 객체로 변환
    const data: SpreadsheetData = {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };

    return data;
  } catch (error) {
    console.error('스프레드시트 데이터 로드 실패:', error);
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

/**
 * 스프레드시트 저장
 */
export const saveSpreadsheet = async (spreadsheetDto: CreateSpreadsheetDto): Promise<SpreadsheetData> => {
  try {
    console.log('==================== Save Spreadsheet API 요청 시작 ====================');
    console.log('요청 URL:', `${API_BASE_URL}/spreadsheet/data/save`);
    console.log('요청 데이터:', JSON.stringify(spreadsheetDto, null, 2));
    console.log('==================== Save Spreadsheet API 요청 데이터 끝 ====================');

    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/data/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spreadsheetDto),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('==================== Save Spreadsheet API 오류 상세 정보 ====================');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Body:', errorText);
      console.error('Request Body was:', JSON.stringify(spreadsheetDto, null, 2));
      console.error('==================== Save Spreadsheet API 오류 정보 끝 ====================');
      
      let errorMessage = `API 오류: ${response.status} - ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
        } else if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    console.log('==================== Save Spreadsheet API 응답 ====================');
    console.log('응답 데이터:', JSON.stringify(result, null, 2));
    console.log('==================== Save Spreadsheet API 응답 끝 ====================');
    
    if (!result.success) {
      throw new Error(result.message || '스프레드시트 저장에 실패했습니다.');
    }

    // Date 객체로 변환
    const data: SpreadsheetData = {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };

    return data;
  } catch (error) {
    console.error('스프레드시트 저장 실패:', error);
    throw error;
  }
};

/**
 * 델타 기반 자동저장
 */
export const deltaAutoSave = async (deltaDto: DeltaAutoSaveDto): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/auto-save/delta`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deltaDto),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '델타 자동저장에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('델타 자동저장 실패:', error);
    throw error;
  }
};

/**
 * 레거시 자동저장
 */
export const autoSaveSpreadsheet = async (autoSaveDto: AutoSaveSpreadsheetDto): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/auto-save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(autoSaveDto),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '자동저장에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('자동저장 실패:', error);
    throw error;
  }
};

/**
 * 자동저장 상태 확인
 */
export const getAutoSaveStatus = async (userId: string, spreadsheetId: string): Promise<any> => {
  try {
    const params = new URLSearchParams({
      userId,
      spreadsheetId,
    });

    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/auto-save/status?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '자동저장 상태 확인에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('자동저장 상태 확인 실패:', error);
    throw error;
  }
};

/**
 * 강제 자동저장 실행
 */
export const forceAutoSave = async (userId: string, spreadsheetId: string): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/auto-save/force`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          spreadsheetId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '강제 자동저장에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('강제 자동저장 실패:', error);
    throw error;
  }
};

/**
 * 자동저장 통계 조회
 */
export const getAutoSaveStats = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/spreadsheet/auto-save/stats?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '자동저장 통계 조회에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('자동저장 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * SpreadsheetData를 XLSXData 타입으로 변환
 */
export const convertSpreadsheetDataToXLSXData = (spreadsheetData: SpreadsheetData): any => {
  return {
    fileName: spreadsheetData.fileName,
    activeSheetIndex: spreadsheetData.activeSheetIndex || 0,
    spreadsheetId: spreadsheetData.id,
    sheets: spreadsheetData.sheets.map(sheet => ({
      sheetName: sheet.name,
      rawData: sheet.data,
      metadata: {
        rowCount: sheet.data?.length || 0,
        columnCount: sheet.data?.[0]?.length || 0,
        dataRange: {
          startRow: 0,
          endRow: Math.max(0, (sheet.data?.length || 0) - 1),
          startCol: 0,
          endCol: Math.max(0, (sheet.data?.[0]?.length || 0) - 1),
          startColLetter: 'A',
          endColLetter: String.fromCharCode(65 + Math.max(0, (sheet.data?.[0]?.length || 0) - 1))
        },
        preserveOriginalStructure: true,
        lastModified: spreadsheetData.updatedAt
      }
    })),
    id: spreadsheetData.id,
    userId: spreadsheetData.userId,
    chatId: spreadsheetData.chatId,
    originalFileName: spreadsheetData.originalFileName,
    fileSize: spreadsheetData.fileSize,
    fileType: spreadsheetData.fileType,
    createdAt: spreadsheetData.createdAt,
    updatedAt: spreadsheetData.updatedAt,
  };
};

// Firebase 호환성을 위한 레거시 함수들 (아직 구현되지 않은 API)
export const getSpreadsheetByChatId = async (chatId: string): Promise<any> => {
  // 이 기능은 새 API에 없으므로 채팅 정보에서 spreadsheetId를 가져와야 함
  throw new Error('getSpreadsheetByChatId는 더 이상 지원되지 않습니다. 채팅 정보에서 spreadsheetId를 사용하세요.');
}; 