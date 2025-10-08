import { useState, useCallback, use } from 'react';
import * as GC from "@mescius/spread-sheets";
import useFileNameStore from '@/_aaa_sheetChat/_store/sheet/fileNameStore';

interface ExportState {
  isExporting: boolean;
  lastExportedAt: Date | null;
  error: string | null;
}

interface UseFileExportOptions {
  defaultFileName?: string; // 기본 파일명
  onExportSuccess?: (fileName: string) => void;
  onExportError?: (error: Error) => void;
}

export const useFileExport = (
  spreadInstance: any,
  options: UseFileExportOptions = {}
) => {
  const {
    defaultFileName = 'spreadsheet',
    onExportSuccess,
    onExportError
  } = options;

  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    lastExportedAt: null,
    error: null
  });

  // JSON으로 저장
  const saveAsJSON = useCallback(async (fileName?: string): Promise<void> => {
    if (!spreadInstance) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    setExportState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      // store에서 가져온 fileName을 우선 사용, 없으면 매개변수, 그것도 없으면 기본값
      const finalFileName = fileName || useFileNameStore.getState().fileName || defaultFileName;
      console.log('✅ [asdfsadfasfasfasfsadf] saveAsJSON - finalFileName:', finalFileName);
      const fullFileName = `${finalFileName}.json`;

      const jsonData = spreadInstance.toJSON({
        includeBindingSource: true,
        ignoreFormula: false,
        ignoreStyle: false,
        saveAsView: true,
        rowHeadersAsFrozenColumns: false,
        columnHeadersAsFrozenRows: false,
        includeAutoMergedCells: true,
        saveR1C1Formula: true,
        includeUnsupportedFormula: true,
        includeUnsupportedStyle: true
      });

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        lastExportedAt: new Date()
      }));

      onExportSuccess?.(fullFileName);

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      }));
      
      const errorObj = error instanceof Error ? error : new Error('JSON 저장 실패');
      onExportError?.(errorObj);
      throw errorObj;
    }
  }, [spreadInstance, defaultFileName, onExportSuccess, onExportError]);

  // Excel로 저장
  const saveAsExcel = useCallback(async (fileName?: string): Promise<void> => {
    if (!spreadInstance) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    setExportState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      // store에서 가져온 fileName을 우선 사용, 없으면 매개변수, 그것도 없으면 기본값
      const finalFileName = fileName || useFileNameStore.getState().fileName || defaultFileName;
      const fullFileName = `${finalFileName}.xlsx`;

      const exportOptions = {
        fileType: GC.Spread.Sheets.FileType.excel,
        includeStyles: true,
        includeFormulas: true
      };

      return new Promise((resolve, reject) => {
        spreadInstance.export(
          (blob: Blob) => {
            try {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fullFileName;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              setExportState(prev => ({
                ...prev,
                isExporting: false,
                lastExportedAt: new Date()
              }));

              onExportSuccess?.(fullFileName);
              resolve();
            } catch (error) {
              setExportState(prev => ({
                ...prev,
                isExporting: false,
                error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
              }));
              
              const errorObj = error instanceof Error ? error : new Error('Excel 저장 실패');
              onExportError?.(errorObj);
              reject(errorObj);
            }
          },
          (error: any) => {
            setExportState(prev => ({
              ...prev,
              isExporting: false,
              error: error.message || '저장 중 오류가 발생했습니다.'
            }));
            onExportError?.(error);
            reject(error);
          },
          exportOptions
        );
      });

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      }));
      
      const errorObj = error instanceof Error ? error : new Error('Excel 저장 실패');
      onExportError?.(errorObj);
      throw errorObj;
    }
  }, [spreadInstance, defaultFileName, onExportSuccess, onExportError]);

  // CSV로 저장
  const saveAsCSV = useCallback(async (fileName?: string): Promise<void> => {
    if (!spreadInstance) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    setExportState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      // store에서 가져온 fileName을 우선 사용, 없으면 매개변수, 그것도 없으면 기본값
      const finalFileName = fileName || useFileNameStore.getState().fileName || defaultFileName;
      const fullFileName = `${finalFileName}.csv`;

      const exportOptions = {
        fileType: GC.Spread.Sheets.FileType.csv
      };

      return new Promise((resolve, reject) => {
        spreadInstance.export(
          (blob: Blob) => {
            try {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fullFileName;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              setExportState(prev => ({
                ...prev,
                isExporting: false,
                lastExportedAt: new Date()
              }));

              onExportSuccess?.(fullFileName);
              resolve();
            } catch (error) {
              setExportState(prev => ({
                ...prev,
                isExporting: false,
                error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
              }));
              
              const errorObj = error instanceof Error ? error : new Error('CSV 저장 실패');
              onExportError?.(errorObj);
              reject(errorObj);
            }
          },
          (error: any) => {
            setExportState(prev => ({
              ...prev,
              isExporting: false,
              error: error.message || '저장 중 오류가 발생했습니다.'
            }));
            onExportError?.(error);
            reject(error);
          },
          exportOptions
        );
      });

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      }));
      
      const errorObj = error instanceof Error ? error : new Error('CSV 저장 실패');
      onExportError?.(errorObj);
      throw errorObj;
    }
  }, [spreadInstance, defaultFileName, onExportSuccess, onExportError]);

  // SJS(SpreadJS 네이티브 형식)로 저장
  const saveAsSJS = useCallback(async (fileName?: string): Promise<void> => {
    if (!spreadInstance) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    setExportState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      // store에서 가져온 fileName을 우선 사용, 없으면 매개변수, 그것도 없으면 기본값
      const finalFileName = fileName || useFileNameStore.getState().fileName || defaultFileName;
      const fullFileName = `${finalFileName}.sjs`;

      const jsonData = spreadInstance.toJSON({
        includeBindingSource: true,
        ignoreFormula: false,
        ignoreStyle: false,
        saveAsView: true,
        rowHeadersAsFrozenColumns: false,
        columnHeadersAsFrozenRows: false,
        includeAutoMergedCells: true,
        saveR1C1Formula: true,
        includeUnsupportedFormula: true,
        includeUnsupportedStyle: true
      });

      const jsonString = JSON.stringify(jsonData);
      const blob = new Blob([jsonString], { type: 'application/sjs' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        lastExportedAt: new Date()
      }));

      onExportSuccess?.(fullFileName);

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      }));
      
      const errorObj = error instanceof Error ? error : new Error('SJS 저장 실패');
      onExportError?.(errorObj);
      throw errorObj;
    }
  }, [spreadInstance, defaultFileName, onExportSuccess, onExportError]);

  // 상태 리셋
  const resetExportState = useCallback(() => {
    setExportState({
      isExporting: false,
      lastExportedAt: null,
      error: null
    });
  }, []);

  return {
    // 상태
    exportState,
    
    // 저장 함수들
    saveAsExcel,
    saveAsCSV,
    saveAsJSON,
    saveAsSJS,
    
    // 상태 관리
    resetExportState
  };
};
