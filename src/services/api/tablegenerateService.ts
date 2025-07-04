// 백엔드 table-generate API 호출을 위한 서비스

// ProcessChatRequest DTO (백엔드와 동일)
export interface ProcessChatRequest {
  chatId: string;
  userId: string;
  files: File[];
  message: string;
  webSearchEnabled: boolean;
  fileNames?: string[];
  fileSizes?: string[];
}

// 시트 테이블 데이터 DTO
export interface TableGenerateSheetTableDataDto {
  id: string;
  name: string;
  index: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

// 시트 메타데이터 DTO
export interface TableGenerateSheetMetaDataDto {
  id: string;
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  sheetTableData: TableGenerateSheetTableDataDto[];
}

// 채팅 처리 응답 DTO (백엔드와 동일)
export interface ProcessChatResponse {
  chatId: string;
  sheetMetaData?: TableGenerateSheetMetaDataDto;
  success?: boolean;
  error?: string;
  message?: string;
  processingTime?: number;
}

// 내부 처리용 DTO들
export interface GeneratedSheetData {
  name: string;
  index: number;
  data: any[][];
}

export interface TableGenerationResult {
  sheets: GeneratedSheetData[];
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  activeSheetIndex: number;
}

// 파일 업로드 진행 상태
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// 파일 업로드 콜백 타입
export type FileUploadProgressCallback = (progress: FileUploadProgress) => void;

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 파일 업로드 및 테이블 생성 처리
 */
export const processTableGeneration = async (
  request: ProcessChatRequest,
  progressCallback?: FileUploadProgressCallback
): Promise<ProcessChatResponse> => {
  try {
    console.log('테이블 생성 요청 시작:', {
      chatId: request.chatId,
      userId: request.userId,
      message: request.message,
      filesCount: request.files.length,
      webSearchEnabled: request.webSearchEnabled
    });

    // FormData 생성
    const formData = new FormData();
    
    // 파일들 추가
    request.files.forEach((file, index) => {
      formData.append('files', file);
    });

    // 기본 필드들 추가
    formData.append('chatId', request.chatId);
    formData.append('userId', request.userId);
    formData.append('message', request.message);
    formData.append('webSearchEnabled', request.webSearchEnabled.toString());

    // 선택적 필드들 추가
    if (request.fileNames && request.fileNames.length > 0) {
      request.fileNames.forEach((name, index) => {
        formData.append('fileNames', name);
      });
    }

    if (request.fileSizes && request.fileSizes.length > 0) {
      request.fileSizes.forEach((size, index) => {
        formData.append('fileSizes', size);
      });
    }

    // XMLHttpRequest를 사용하여 진행 상태 추적
    const response = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 진행 상태 추적
      if (progressCallback) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: FileUploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            progressCallback(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Response 객체 생성
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers({
              'Content-Type': 'application/json'
            })
          });
          resolve(response);
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('요청 시간이 초과되었습니다.'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/chat/process`);
      xhr.timeout = 300000; // 5분 타임아웃
      xhr.send(formData);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: ProcessChatResponse = await response.json();
    
    console.log('테이블 생성 응답 받음:', {
      success: data.success,
      chatId: data.chatId,
      hasSheetData: !!data.sheetMetaData,
      processingTime: data.processingTime
    });

    return data;

  } catch (error) {
    console.error('테이블 생성 처리 실패:', error);
    
    // 에러 응답 반환
    return {
      chatId: request.chatId,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      message: '파일 처리 및 테이블 생성에 실패했습니다.',
    };
  }
};

/**
 * 파일 검증
 */
export const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/json', // .json
    'text/plain', // .txt
  ];

  if (!files || files.length === 0) {
    errors.push('업로드할 파일을 선택해주세요.');
    return { valid: false, errors };
  }

  if (files.length > 10) {
    errors.push('최대 10개의 파일까지 업로드할 수 있습니다.');
  }

  files.forEach((file, index) => {
    // 파일 크기 검증
    if (file.size > maxFileSize) {
      errors.push(`파일 ${index + 1} (${file.name}): 파일 크기가 50MB를 초과했습니다.`);
    }

    // 파일 타입 검증
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType = allowedTypes.includes(file.type) || 
      ['xlsx', 'xls', 'csv', 'json', 'txt'].includes(fileExtension || '');

    if (!isValidType) {
      errors.push(`파일 ${index + 1} (${file.name}): 지원되지 않는 파일 형식입니다. (지원 형식: xlsx, xls, csv, json, txt)`);
    }

    // 파일명 검증
    if (!file.name || file.name.trim() === '') {
      errors.push(`파일 ${index + 1}: 올바르지 않은 파일명입니다.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 파일 정보 추출
 */
export const extractFileInfo = (files: File[]): { fileNames: string[]; fileSizes: string[] } => {
  const fileNames = files.map(file => file.name);
  const fileSizes = files.map(file => file.size.toString());
  
  return { fileNames, fileSizes };
};

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 지원되는 파일 형식 목록 반환
 */
export const getSupportedFileTypes = (): string[] => {
  return ['xlsx', 'xls', 'csv', 'json', 'txt'];
};

/**
 * 파일이 지원되는 형식인지 확인
 */
export const isSupportedFileType = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().split('.').pop();
  return getSupportedFileTypes().includes(extension || '');
};

/**
 * ProcessChatRequest 객체 생성 헬퍼
 */
export const createProcessChatRequest = (
  chatId: string,
  userId: string,
  files: File[],
  message: string,
  webSearchEnabled: boolean = false
): ProcessChatRequest => {
  const { fileNames, fileSizes } = extractFileInfo(files);
  
  return {
    chatId,
    userId,
    files,
    message,
    webSearchEnabled,
    fileNames,
    fileSizes,
  };
};

/**
 * 응답에서 시트 데이터 추출
 */
export const extractSheetData = (response: ProcessChatResponse): TableGenerateSheetTableDataDto[] => {
  if (!response.sheetMetaData || !response.sheetMetaData.sheetTableData) {
    return [];
  }
  
  return response.sheetMetaData.sheetTableData;
};

/**
 * 응답 성공 여부 확인
 */
export const isProcessingSuccessful = (response: ProcessChatResponse): boolean => {
  return response.success === true && !response.error;
};

/**
 * 에러 메시지 추출
 */
export const extractErrorMessage = (response: ProcessChatResponse): string => {
  return response.error || response.message || '알 수 없는 오류가 발생했습니다.';
};
