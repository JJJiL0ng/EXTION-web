import { useState, useCallback } from 'react';
import * as GC from "@mescius/spread-sheets";

interface RenderProgress {
  isRendering: boolean;
  isProcessing: boolean;
  progress: number;
  fileName: string;
  error: string | null;
}

interface UseSheetRenderOptions {
  maxDirectLoadSize?: number; // 직접 로드 가능한 최대 파일 크기 (기본: 10MB)
  onSuccess?: (fileName: string) => void;
  onError?: (error: Error, fileName: string) => void;
}

export const useSheetRender = (options: UseSheetRenderOptions = {}) => {
  const {
    maxDirectLoadSize = 10 * 1024 * 1024, // 10MB
    onSuccess,
    onError
  } = options;

  const [renderState, setRenderState] = useState<RenderProgress>({
    isRendering: false,
    isProcessing: false,
    progress: 0,
    fileName: '',
    error: null
  });

  // 파일 형식 검증
  const validateFile = useCallback((file: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/sjs',
      'application/json'
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop();
    return allowedTypes.includes(file.type) ||
      ['xlsx', 'xls', 'csv', 'sjs', 'json'].includes(fileExtension || '');
  }, []);

  // 청크 처리 필요 여부 결정
  const shouldUseChunkedProcessing = useCallback((file: File): boolean => {
    return file.size > maxDirectLoadSize;
  }, [maxDirectLoadSize]);

  // 진행률 업데이트
  const updateProgress = useCallback((progress: number) => {
    setRenderState(prev => ({ ...prev, progress }));
  }, []);

  // 상태 초기화
  const resetState = useCallback(() => {
    setRenderState({
      isRendering: false,
      isProcessing: false,
      progress: 0,
      fileName: '',
      error: null
    });
  }, []);

  // JSON/SJS 파일 처리
  const processJSONFile = useCallback(async (
    file: File,
    fileExtension: string,
    spreadInstance: any
  ): Promise<void> => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          updateProgress(25);
          const jsonData = JSON.parse(e.target?.result as string);

          updateProgress(50);
          console.log(`📄 ${fileExtension.toUpperCase()} 파일 로드 중...`);

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

              console.log(`✅ ${fileExtension.toUpperCase()} 파일 로드 완료`);
              resolve();

            } finally {
              sheet.resumePaint();
            }
          }
        } catch (error) {
          console.error(`❌ ${fileExtension.toUpperCase()} 파일 처리 실패:`, error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file);
    });
  }, [updateProgress]);

  // Excel/CSV 파일 처리
  const processExcelFile = useCallback(async (
    file: File,
    fileExtension: string,
    spreadInstance: any
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!spreadInstance) {
        reject(new Error('SpreadJS 인스턴스가 없습니다.'));
        return;
      }

      updateProgress(25);

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
      sheet.suspendPaint();

      spreadInstance.import(
        file,
        () => {
          try {
            updateProgress(100);
            console.log('✅ 파일 로드 완료:', file.name);
            resolve();
          } finally {
            sheet.resumePaint();
          }
        },
        (error: any) => {
          sheet.resumePaint();
          console.error('❌ 파일 로드 실패:', error);
          reject(error);
        },
        importOptions
      );

      // 진행률 시뮬레이션
      setTimeout(() => updateProgress(50), 500);
      setTimeout(() => updateProgress(75), 1000);
    });
  }, [updateProgress]);

  // 청크 단위 파일 처리
  const processFileInChunks = useCallback(async (
    file: File,
    fileExtension: string,
    spreadInstance: any
  ): Promise<void> => {
    setRenderState(prev => ({ ...prev, isProcessing: true }));
    updateProgress(0);

    try {
      if (fileExtension === 'sjs' || fileExtension === 'json') {
        await processJSONFile(file, fileExtension, spreadInstance);
      } else {
        await processExcelFile(file, fileExtension, spreadInstance);
      }
    } catch (error) {
      console.error('❌ 청크 처리 실패:', error);
      throw error;
    } finally {
      setRenderState(prev => ({ ...prev, isProcessing: false }));
      updateProgress(0);
    }
  }, [processJSONFile, processExcelFile, updateProgress]);

  // 메인 렌더링 함수
  const renderFile = useCallback(async (file: File, spreadInstance: any): Promise<void> => {
    // 파일 검증
    if (!validateFile(file)) {
      const error = new Error('지원되지 않는 파일 형식입니다. Excel 파일(.xlsx, .xls), CSV 파일(.csv), SpreadJS 파일(.sjs), 또는 JSON 파일(.json)을 선택해주세요.');
      setRenderState(prev => ({ ...prev, error: error.message }));
      onError?.(error, file.name);
      return;
    }

    // SpreadJS 인스턴스 검증
    if (!spreadInstance) {
      const error = new Error('SpreadJS 인스턴스가 초기화되지 않았습니다.');
      setRenderState(prev => ({ ...prev, error: error.message }));
      onError?.(error, file.name);
      return;
    }

    // 렌더링 시작
    setRenderState({
      isRendering: true,
      isProcessing: false,
      progress: 0,
      fileName: file.name,
      error: null
    });

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (!fileExtension) {
        throw new Error('파일 확장자를 확인할 수 없습니다.');
      }

      // 파일 크기에 따른 처리 방식 결정
      if (shouldUseChunkedProcessing(file)) {
        console.log('📦 대용량 파일 감지 - 청크 처리 모드');
        await processFileInChunks(file, fileExtension, spreadInstance);
      } else {
        console.log('📄 일반 처리 모드');
        if (fileExtension === 'sjs' || fileExtension === 'json') {
          await processJSONFile(file, fileExtension, spreadInstance);
        } else {
          await processExcelFile(file, fileExtension, spreadInstance);
        }
      }

      // 성공 처리
      setRenderState(prev => ({
        ...prev,
        isRendering: false,
        isProcessing: false,
        progress: 100
      }));

      onSuccess?.(file.name);

    } catch (error) {
      console.error('❌ 파일 렌더링 실패:', error);
      
      const errorMessage = error instanceof Error ? error.message : '파일 렌더링 중 오류가 발생했습니다.';
      
      setRenderState(prev => ({
        ...prev,
        isRendering: false,
        isProcessing: false,
        progress: 0,
        error: errorMessage
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage), file.name);
    }
  }, [
    validateFile,
    shouldUseChunkedProcessing,
    processFileInChunks,
    processJSONFile,
    processExcelFile,
    onSuccess,
    onError
  ]);

  return {
    renderState,
    renderFile,
    resetState,
    validateFile
  };
};