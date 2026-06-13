import { useState, useCallback } from 'react';
import * as GC from "@mescius/spread-sheets";
import {
  DEFAULT_ALLOWED_UPLOAD_EXTENSIONS,
  DEFAULT_MAX_UPLOAD_FILE_SIZE,
  validateUploadFile,
} from '@/_aaa_sheetChat/_utils/sheet/fileUploadValidation';

interface FileUploadState {
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  fileName: string;
  error: string | null;
  uploadedFiles: string[];
}

interface UseFileUploadOptions {
  maxFileSize?: number; // 최대 파일 크기 (기본: 50MB)
  allowedExtensions?: readonly string[]; // 허용된 파일 확장자
  onUploadSuccess?: (fileName: string, fileData: any) => void;
  onUploadError?: (error: Error, fileName: string) => void;
}

export const useFileUpload = (
  spreadInstance: any,
  options: UseFileUploadOptions = {}
) => {
  const {
    maxFileSize = DEFAULT_MAX_UPLOAD_FILE_SIZE,
    allowedExtensions = DEFAULT_ALLOWED_UPLOAD_EXTENSIONS,
    onUploadSuccess,
    onUploadError
  } = options;

  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    isProcessing: false,
    progress: 0,
    fileName: '',
    error: null,
    uploadedFiles: []
  });

  // 파일 검증
  const validateFile = useCallback(
    (file: File) => validateUploadFile(file, { maxFileSize, allowedExtensions }),
    [maxFileSize, allowedExtensions]
  );

  // 진행률 업데이트
  const updateProgress = useCallback((progress: number) => {
    setUploadState(prev => ({ ...prev, progress }));
  }, []);

  // JSON/SJS 파일 처리
  const processJSONFile = useCallback(async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          updateProgress(25);
          const jsonData = JSON.parse(e.target?.result as string);

          updateProgress(50);
          console.log(`📄 ${file.name} JSON 파일 파싱 완료`);

          if (spreadInstance) {
            const sheet = spreadInstance.getActiveSheet();
            sheet.suspendPaint();

            try {
              updateProgress(75);

              const deserializationOptions = {
                ignoreFormula: false,
                ignoreStyle: false,
                includeBindingSource: true,
                includeUnsupportedFormula: true,
                includeUnsupportedStyle: true
              };

              await spreadInstance.fromJSON(jsonData, deserializationOptions);
              updateProgress(100);

              console.log(`✅ ${file.name} 파일 로드 완료`);
              resolve(jsonData);

            } finally {
              sheet.resumePaint();
            }
          } else {
            reject(new Error('SpreadJS 인스턴스가 없습니다.'));
          }
        } catch (error) {
          console.error(`❌ ${file.name} 파일 처리 실패:`, error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file);
    });
  }, [spreadInstance, updateProgress]);

  // Excel/CSV 파일 처리
  const processExcelFile = useCallback(async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!spreadInstance) {
        reject(new Error('SpreadJS 인스턴스가 없습니다.'));
        return;
      }

      updateProgress(25);

      const fileExtension = file.name.toLowerCase().split('.').pop();
      let importOptions;

      if (fileExtension === 'csv') {
        importOptions = {
          fileType: GC.Spread.Sheets.FileType.csv,
          includeStyles: true,
          includeFormulas: true
        };
      } else {
        importOptions = {
          fileType: GC.Spread.Sheets.FileType.excel,
          includeStyles: true,
          includeFormulas: true
        };
      }

      const sheet = spreadInstance.getActiveSheet();

      // suspendPaint 안전 체크
      if (sheet && sheet.suspendPaint && typeof sheet.suspendPaint === 'function') {
        sheet.suspendPaint();
      }

      spreadInstance.import(
        file,
        () => {
          try {
            updateProgress(100);
            console.log('✅ 파일 로드 완료:', file.name);

            // 데이터 추출
            const jsonData = spreadInstance.toJSON({
              includeBindingSource: true,
              ignoreFormula: false,
              ignoreStyle: false,
              saveAsView: true,
              rowHeadersAsFrozenColumns: true,
              columnHeadersAsFrozenRows: true,
              includeAutoMergedCells: true,
              saveR1C1Formula: true,
              includeUnsupportedFormula: true,
              includeUnsupportedStyle: true
            });
            resolve(jsonData);
          } finally {
            // resumePaint 안전 체크
            if (sheet && sheet.resumePaint && typeof sheet.resumePaint === 'function') {
              sheet.resumePaint();
            }
          }
        },
        (error: any) => {
          // resumePaint 안전 체크 (에러 핸들러에서도)
          if (sheet && sheet.resumePaint && typeof sheet.resumePaint === 'function') {
            sheet.resumePaint();
          }
          console.error('❌ 파일 로드 실패:', error);
          reject(error);
        },
        importOptions
      );

      // 진행률 시뮬레이션
      setTimeout(() => updateProgress(50), 500);
      setTimeout(() => updateProgress(75), 1000);
    });
  }, [spreadInstance, updateProgress]);

  // 통합 파일 업로드 (단일/다중 자동 처리)
  const uploadFiles = useCallback(async (files: FileList | File): Promise<any[]> => {
    // File 객체를 FileList로 변환하거나 그대로 사용
    const fileList = files instanceof File ? [files] : Array.from(files);
    const results = [];
    const totalFiles = fileList.length;

    console.log(`📁 ${totalFiles}개 파일 업로드 시작`);

    // 다중 파일 업로드 상태로 설정
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      isProcessing: true,
      progress: 0,
      fileName: totalFiles === 1 ? fileList[0].name : `${totalFiles}개 파일`,
      error: null
    }));

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        try {
          // 각 파일별 진행률 계산 (전체 진행률에서 현재 파일의 위치)
          const baseProgress = (i / totalFiles) * 100;
          const fileProgressRange = 100 / totalFiles;

          console.log(`📄 파일 ${i + 1}/${totalFiles} 처리 중: ${file.name}`);

          // 파일 검증
          const validation = validateFile(file);
          if (!validation.isValid) {
            throw new Error(validation.error!);
          }

          // SpreadJS 인스턴스 검증
          if (!spreadInstance) {
            throw new Error('SpreadJS 인스턴스가 초기화되지 않았습니다.');
          }

          // 현재 파일 처리 시작
          setUploadState(prev => ({
            ...prev,
            fileName: totalFiles === 1 ? file.name : `${file.name} (${i + 1}/${totalFiles})`,
            progress: Math.round(baseProgress)
          }));

          const fileExtension = file.name.toLowerCase().split('.').pop();
          let fileData;

          if (fileExtension === 'sjs' || fileExtension === 'json') {
            fileData = await processJSONFile(file);
          } else {
            fileData = await processExcelFile(file);
          }

          // 파일 처리 완료
          results.push({
            fileName: file.name,
            data: fileData,
            success: true
          });

          // 진행률 업데이트
          setUploadState(prev => ({
            ...prev,
            progress: Math.round(baseProgress + fileProgressRange),
            uploadedFiles: [...prev.uploadedFiles, file.name]
          }));

          console.log(`✅ 파일 ${i + 1}/${totalFiles} 완료: ${file.name}`);

        } catch (error) {
          console.error(`❌ 파일 ${file.name} 업로드 실패:`, error);

          // 실패한 파일도 결과에 추가 (에러 정보와 함께)
          results.push({
            fileName: file.name,
            data: null,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          });

          // 단일 파일인 경우 즉시 에러 throw
          if (totalFiles === 1) {
            setUploadState(prev => ({
              ...prev,
              isUploading: false,
              isProcessing: false,
              progress: 0,
              error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
            }));

            onUploadError?.(error instanceof Error ? error : new Error('파일 업로드 실패'), file.name);
            throw error;
          }

          // 다중 파일인 경우 계속 진행
        }
      }

      // 모든 파일 처리 완료
      const successFiles = results.filter(r => r.success);
      const failedFiles = results.filter(r => !r.success);

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: false,
        progress: 100,
        fileName: totalFiles === 1
          ? (successFiles.length > 0 ? successFiles[0].fileName : '')
          : `${successFiles.length}/${totalFiles}개 파일 완료`,
        error: failedFiles.length > 0 ? `${failedFiles.length}개 파일 실패` : null
      }));

      // 성공 콜백 호출
      if (successFiles.length > 0) {
        if (totalFiles === 1) {
          onUploadSuccess?.(successFiles[0].fileName, successFiles[0].data);
        } else {
          // 다중 파일의 경우 성공한 파일들의 이름과 데이터 전달
          onUploadSuccess?.(
            `${successFiles.length}개 파일 업로드 완료`,
            successFiles.map(f => f.data)
          );
        }
      }

      // 실패 콜백 호출 (다중 파일에서 일부 실패한 경우)
      if (failedFiles.length > 0 && totalFiles > 1) {
        const errorMessage = `${failedFiles.length}개 파일 업로드 실패: ${failedFiles.map(f => f.fileName).join(', ')}`;
        onUploadError?.(new Error(errorMessage), failedFiles.map(f => f.fileName).join(', '));
      }

      console.log(`🎉 업로드 완료: 성공 ${successFiles.length}개, 실패 ${failedFiles.length}개`);
      return results;

    } catch (error) {
      // 예상치 못한 전체 오류
      console.error('❌ 전체 업로드 프로세스 실패:', error);

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: false,
        progress: 0,
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
      }));

      throw error;
    }
  }, [
    validateFile,
    spreadInstance,
    processJSONFile,
    processExcelFile,
    onUploadSuccess,
    onUploadError
  ]);

  // 기존 함수들을 새로운 통합 함수로 래핑 (하위 호환성)
  const uploadFile = useCallback(async (file: File): Promise<any> => {
    // uploadFiles 직접 참조 제거하여 순환 의존성 방지
    const fileList = [file];
    const results = [];
    const totalFiles = fileList.length;

    console.log(`📁 ${totalFiles}개 파일 업로드 시작`);

    // 업로드 상태로 설정
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      isProcessing: true,
      progress: 0,
      fileName: file.name,
      error: null
    }));

    try {
      // 파일 검증
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error!);
      }

      // SpreadJS 인스턴스 검증
      if (!spreadInstance) {
        throw new Error('SpreadJS 인스턴스가 초기화되지 않았습니다.');
      }

      // 파일 처리
      let data: any;
      if (file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.sjs')) {
        data = await processJSONFile(file);
      } else {
        data = await processExcelFile(file);
      }

      const result = { success: true, data, fileName: file.name };
      results.push(result);

      // 성공 콜백
      if (onUploadSuccess) {
        try {
          onUploadSuccess(file.name, data);
        } catch (callbackError) {
          console.warn('onUploadSuccess 콜백 실패:', callbackError);
        }
      }

      // 최종 상태 업데이트
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, file.name]
      }));

      return result.data;
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: false,
        progress: 0,
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
      }));

      if (onUploadError) {
        try {
          onUploadError(error instanceof Error ? error : new Error('Unknown error'), file.name);
        } catch (callbackError) {
          console.warn('onUploadError 콜백 실패:', callbackError);
        }
      }

      throw error;
    }
  }, [validateFile, spreadInstance, processJSONFile, processExcelFile, onUploadSuccess, onUploadError]);

  const uploadMultipleFiles = useCallback(async (files: FileList): Promise<any[]> => {
    // uploadFiles를 직접 사용하여 순환 의존성 방지
    const results = await uploadFiles(files);
    return results.filter(r => r.success).map(r => r.data);
  }, [uploadFiles]);

  // 상태 리셋
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      isProcessing: false,
      progress: 0,
      fileName: '',
      error: null,
      uploadedFiles: []
    });
  }, []);

  return {
    // 상태
    uploadState,

    // 통합 업로드 함수 (권장)
    uploadFiles,

    // 업로드 함수 (하위 호환성)
    uploadFile,
    uploadMultipleFiles,
    validateFile,

    // 상태 관리
    resetUploadState
  };
};
