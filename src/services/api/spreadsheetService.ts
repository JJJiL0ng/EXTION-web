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
 * 스프레드시트 데이터 로드
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
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
    totalSheets: spreadsheetData.sheets.length,
    activeSheetIndex: spreadsheetData.activeSheetIndex || 0,
    hasSpreadsheet: true,
    lastModifiedAt: spreadsheetData.updatedAt,
    sheetNames: spreadsheetData.sheets.map(sheet => sheet.name),
    sheets: spreadsheetData.sheets.map(sheet => ({
      sheetName: sheet.name,
      data: sheet.data,
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