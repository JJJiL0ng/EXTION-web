// api/sheetApi.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_PATH = '/v2/table-data-json-save';

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

export interface SpreadSheetData {
  id: string;
  fileName: string;
  data: any;
  version: number;
  lastModified: string;
}

export interface DeltaResponse {
  version: number;
  applied: boolean;
}

export interface GPTData {
  totalCells: number;
  sheetCount: number;
  dataHash: string;
  parsedAt: string;
  sheets: Array<{
    name: string;
    cellCount: number;
    csvData: string;
    metadata: any;
  }>;
}

export interface SpreadSheetListItem {
  id: string;
  fileName: string;
  fileSize: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastOpened: string;
  sheetCount: number;
  compressedSize: number;
  chatCount: number;
  editCount: number;
  isActive: boolean;
}

export interface PaginatedSpreadSheets {
  spreadSheets: SpreadSheetListItem[];
  pagination: {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export interface SaveResult {
  savedDeltas: number;
}

export interface StatusData {
  hasActiveSpreadSheet: boolean;
  totalCells: number;
  sheetCount: number;
  dataHash: string | null;
  lastActivity: string | null;
}

// 요청 타입 정의
export interface CreateSpreadSheetRequest {
  fileName: string;
  spreadsheetId: string; // 백엔드와 일치하도록 수정 (spreadSheetId → spreadsheetId)
  chatId: string;
  userId: string;
  initialData?: Record<string, any>; // Optional로 변경하여 전체 JSON 데이터 또는 undefined 허용
}

export interface LoadSpreadSheetRequest {
  spreadsheetId: string; // 백엔드와 일치하도록 수정
}

export interface ApplyDeltaRequest {
  action: string;
  parsedSheetName: string;
  
  cellAddress?: string;
  range?: string;
  value?: any;
  formula?: string;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    border?: any;
  };
  rowIndex?: number;
  columnIndex?: number;
  count?: number;
}

export interface BatchDeltasRequest {
  userId: string; // 백엔드에서 필요한 userId 추가
  spreadsheetId: string; // 백엔드에서 필요한 spreadsheetId 추가
  deltas: ApplyDeltaRequest[];
}

// 인증 토큰을 가져오는 함수 (실제 구현은 프로젝트에 따라 다름)
const getAuthToken = (): string | null => {
  // localStorage, cookies, 또는 상태 관리에서 토큰 가져오기
  return localStorage.getItem('authToken');
};

// 기본 fetch 함수
const apiFetch = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // 요청 URL 및 데이터 로깅
  const fullUrl = `${API_BASE_URL}${API_PATH}${endpoint}`;
  console.log('🚀 [SheetAPI] 요청 정보:', {
    url: fullUrl,
    method: config.method || 'GET',
    endpoint: endpoint,
    headers: config.headers,
    ...(config.body && { 
      body: config.body,
      parsedBody: (() => {
        try {
          return JSON.parse(config.body as string);
        } catch {
          return config.body;
        }
      })()
    })
  });

  try {
    const response = await fetch(fullUrl, config);
    
    console.log('📡 [SheetAPI] 응답 상태:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [SheetAPI] 응답 데이터:', {
      url: fullUrl,
      data: data
    });
    
    return data;
  } catch (error) {
    console.error('❌ [SheetAPI] 요청 실패:', {
      url: fullUrl,
      error: error,
      ...(config.body && { requestBody: config.body })
    });
    throw error;
  }
};

// Sheet API 클래스
export class SheetAPI {
  /**
   * 새 스프레드시트 생성
   */
  static async createSpreadSheet(request: CreateSpreadSheetRequest): Promise<ApiResponse<SpreadSheetData>> {
    return apiFetch<SpreadSheetData>('/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 스프레드시트 로드
   */
  static async loadSpreadSheet(request: LoadSpreadSheetRequest): Promise<ApiResponse<SpreadSheetData>> {
    return apiFetch<SpreadSheetData>('/load', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 단일 델타 적용
   */
  static async applyDelta(request: ApplyDeltaRequest): Promise<ApiResponse<DeltaResponse>> {
    return apiFetch<DeltaResponse>('/delta', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * 여러 델타 일괄 적용
   */
  static async applyBatchDeltas(request: BatchDeltasRequest): Promise<ApiResponse<{ appliedCount: number; version: number }>> {
    return apiFetch<{ appliedCount: number; version: number }>('/deltas/batch', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * 현재 상태 조회
   */
  static async getCurrentState(): Promise<ApiResponse<any>> {
    return apiFetch<any>('/current-state', {
      method: 'GET',
    });
  }

  /**
   * GPT용 데이터 조회
   */
  static async getGPTData(): Promise<ApiResponse<GPTData>> {
    return apiFetch<GPTData>('/gpt-data', {
      method: 'GET',
    });
  }

  /**
   * 강제 저장
   */
  static async forceSave(): Promise<ApiResponse<SaveResult>> {
    return apiFetch<SaveResult>('/save', {
      method: 'POST',
    });
  }

  /**
   * 사용자 스프레드시트 목록 조회
   */
  static async getUserSpreadSheets(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedSpreadSheets>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return apiFetch<PaginatedSpreadSheets>(`/list?${queryParams}`, {
      method: 'GET',
    });
  }

  /**
   * 스프레드시트 삭제
   */
  static async deleteSpreadSheet(spreadSheetId: string): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/${spreadSheetId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 메모리 정리
   */
  static async cleanup(): Promise<ApiResponse<void>> {
    return apiFetch<void>('/cleanup', {
      method: 'POST',
    });
  }

  /**
   * 스프레드시트 상태 조회
   */
  static async getStatus(): Promise<ApiResponse<StatusData>> {
    return apiFetch<StatusData>('/status', {
      method: 'GET',
    });
  }
}

// 편의를 위한 개별 함수들도 export
export const {
  createSpreadSheet,
  loadSpreadSheet,
  applyDelta,
  applyBatchDeltas,
  getCurrentState,
  getGPTData,
  forceSave,
  getUserSpreadSheets,
  deleteSpreadSheet,
  cleanup,
  getStatus,
} = SheetAPI;

// 기본 export
export default SheetAPI;