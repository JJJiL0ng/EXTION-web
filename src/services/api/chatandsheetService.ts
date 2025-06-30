// 백엔드 Chat and Sheet API 호출을 위한 서비스

// Sheet Table Data 타입
export interface SheetTableDataDto {
  id: string;
  name: string;
  index: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

// Sheet Meta Data with Tables 타입
export interface SheetMetaDataWithTablesDto {
  id: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  sheetTableData: SheetTableDataDto[];
}

// Chat Sheet Data Response 타입
export interface ChatSheetDataResponseDto {
  chatId: string;
  sheetMetaData?: SheetMetaDataWithTablesDto;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 채팅 ID로 Chat과 Sheet 데이터를 함께 로드
 */
export const loadChatSheetData = async (chatId: string): Promise<ChatSheetDataResponseDto> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chatandsheet/load/${chatId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Chat with id ${chatId} not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatSheetDataResponseDto = await response.json();
    
    // Date 객체로 변환
    if (data.sheetMetaData) {
      data.sheetMetaData.createdAt = new Date(data.sheetMetaData.createdAt);
      data.sheetMetaData.updatedAt = new Date(data.sheetMetaData.updatedAt);
      
      // sheetTableData의 Date도 변환
      data.sheetMetaData.sheetTableData = data.sheetMetaData.sheetTableData.map(table => ({
        ...table,
        createdAt: new Date(table.createdAt),
        updatedAt: new Date(table.updatedAt),
      }));
    }

    return data;
  } catch (error) {
    console.error('Chat과 Sheet 데이터 로드 실패:', error);
    throw error;
  }
};

/**
 * 채팅 ID로 Sheet 데이터가 있는지 확인
 */
export const hasSheetData = async (chatId: string): Promise<boolean> => {
  try {
    const data = await loadChatSheetData(chatId);
    return data.sheetMetaData !== undefined;
  } catch (error) {
    console.error('Sheet 데이터 존재 여부 확인 실패:', error);
    return false;
  }
};

/**
 * 채팅 ID로 Sheet Table Data만 추출
 */
export const getSheetTableData = async (chatId: string): Promise<SheetTableDataDto[]> => {
  try {
    const data = await loadChatSheetData(chatId);
    return data.sheetMetaData?.sheetTableData || [];
  } catch (error) {
    console.error('Sheet Table 데이터 추출 실패:', error);
    throw error;
  }
};

/**
 * 채팅 ID로 특정 시트 인덱스의 데이터 가져오기
 */
export const getSheetDataByIndex = async (chatId: string, sheetIndex: number): Promise<SheetTableDataDto | null> => {
  try {
    const tableDataList = await getSheetTableData(chatId);
    return tableDataList.find(sheet => sheet.index === sheetIndex) || null;
  } catch (error) {
    console.error('특정 시트 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 채팅 ID로 활성화된 시트 데이터 가져오기
 */
export const getActiveSheetData = async (chatId: string): Promise<SheetTableDataDto | null> => {
  try {
    const data = await loadChatSheetData(chatId);
    if (!data.sheetMetaData) {
      return null;
    }
    
    const activeIndex = data.sheetMetaData.activeSheetIndex;
    return data.sheetMetaData.sheetTableData.find(sheet => sheet.index === activeIndex) || null;
  } catch (error) {
    console.error('활성화된 시트 데이터 가져오기 실패:', error);
    throw error;
  }
};
