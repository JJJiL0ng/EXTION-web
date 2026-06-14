export const DEFAULT_MAX_UPLOAD_FILE_SIZE = 50 * 1024 * 1024;

export const DEFAULT_ALLOWED_UPLOAD_EXTENSIONS = ['xlsx', 'xls', 'csv', 'sjs', 'json'] as const;

export const DEFAULT_ALLOWED_UPLOAD_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/sjs',
  'application/json',
] as const;

export interface UploadFileValidationOptions {
  maxFileSize?: number;
  allowedExtensions?: readonly string[];
  allowedMimeTypes?: readonly string[];
}

export interface UploadFileLike {
  name: string;
  size: number;
  type: string;
}

export interface UploadFileValidationResult {
  isValid: boolean;
  error?: string;
}

export const getUploadFileExtension = (fileName: string) => {
  const extension = fileName.toLowerCase().split('.').pop();

  return extension && extension !== fileName.toLowerCase() ? extension : null;
};

export const validateUploadFile = (
  file: UploadFileLike,
  options: UploadFileValidationOptions = {}
): UploadFileValidationResult => {
  const {
    maxFileSize = DEFAULT_MAX_UPLOAD_FILE_SIZE,
    allowedExtensions = DEFAULT_ALLOWED_UPLOAD_EXTENSIONS,
    allowedMimeTypes = DEFAULT_ALLOWED_UPLOAD_MIME_TYPES,
  } = options;

  if (file.size > maxFileSize) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${Math.round(maxFileSize / (1024 * 1024))}MB까지 지원됩니다.`,
    };
  }

  const fileExtension = getUploadFileExtension(file.name);
  const normalizedAllowedExtensions = allowedExtensions.map((extension) => extension.toLowerCase());

  if (!fileExtension || !normalizedAllowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `지원되지 않는 파일 형식입니다. 지원 형식: ${allowedExtensions.join(', ')}`,
    };
  }

  if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
    return {
      isValid: false,
      error: '파일 타입을 확인할 수 없습니다.',
    };
  }

  return { isValid: true };
};
