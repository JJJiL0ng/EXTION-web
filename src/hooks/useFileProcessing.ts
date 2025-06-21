import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useUnifiedStore, ChatMessage } from '@/stores';
import { detectAndDecode } from '@/utils/chatUtils';
import { processXLSXFile } from '@/utils/fileProcessing';

import { FileProcessingState } from '@/types/chat';

export const useFileProcessing = (
  activeSheetIndex: number
) => {
  const [fileState, setFileState] = useState<FileProcessingState>({
    isDragOver: false,
    isProcessing: false
  });

  const {
    xlsxData,
    setXLSXData,
    setLoadingState,
    setError,
    addMessageToSheet,
    setCurrentChatId,
    canUploadFile
  } = useUnifiedStore();

  // 유효한 스프레드시트 파일인지 확인하는 함수
  const isValidSpreadsheetFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    return validExtensions.some((ext: string) => fileName.endsWith(ext));
  };

  // columnIndexToLetter 함수
  const columnIndexToLetter = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  // 로컬 데이터 처리 함수 (Firebase 저장 제거)
  const processSpreadsheetLocally = (xlsxDataToSave: any) => {
    // 로컬에서만 데이터 처리
    setXLSXData(xlsxDataToSave);
    console.log('스프레드시트가 로컬에서 처리되었습니다');
    return { success: true };
  };

  // XLSX 파일 처리
  const processXLSXFileData = async (file: File) => {
    const result = await processXLSXFile(file);

    console.log('processXLSXFile 결과:', {
      sheetsCount: result.sheets.length,
      sheetsInfo: result.sheets.map(s => ({
        name: s.sheetName,
        rawDataLength: s.rawData?.length || 0,
        dataBounds: s.dataBounds
      }))
    });

    const processSheet = (sheet: any) => {
      const maxCols = Math.max(0, ...sheet.rawData.map((row: any) => (row || []).length));
      
      return {
        sheetName: sheet.sheetName,
        rawData: sheet.rawData,
        metadata: {
          rowCount: sheet.rawData.length,
          columnCount: maxCols,
          dataRange: {
            startRow: sheet.metadata?.dataRange?.startRow || 0,
            endRow: sheet.metadata?.dataRange?.endRow || sheet.rawData.length - 1,
            startCol: sheet.metadata?.dataRange?.startCol || 0,
            endCol: sheet.metadata?.dataRange?.endCol || (maxCols || 1) - 1,
            startColLetter: sheet.metadata?.dataRange?.startColLetter || 'A',
            endColLetter: sheet.metadata?.dataRange?.endColLetter || columnIndexToLetter((maxCols || 1) - 1)
          },
          preserveOriginalStructure: true,
          lastModified: new Date()
        }
      };
    };

    if (xlsxData) {
      // 기존 데이터에 새 시트 추가
      const newSheets = result.sheets.map(processSheet);
      
      if (newSheets.length === 0) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'Extion ai',
          content: `${file.name} 파일에서 데이터를 찾을 수 없습니다. 파일이 비어있거나 지원하지 않는 형식일 수 있습니다.`,
          timestamp: new Date()
        };
        addMessageToSheet(activeSheetIndex, errorMessage);
        return;
      }

      const newXlsxData = { ...xlsxData, sheets: [...xlsxData.sheets, ...newSheets] };
      processSpreadsheetLocally(newXlsxData);

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'Extion ai',
        content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
          `추가된 시트 정보:\n` +
          newSheets.map((sheet) => {
            const rawData = sheet.rawData || [[]];
            return `• ${sheet.sheetName}: ${rawData[0]?.length || 0}열 × ${rawData.length}행`;
          }).join('\n'),
        timestamp: new Date()
      };

      addMessageToSheet(activeSheetIndex, successMessage);
    } else {
      // 새 데이터 생성
      const xlsxDataNew = {
        fileName: result.fileName,
        sheets: result.sheets.map(processSheet),
        activeSheetIndex: 0
      };

      processSpreadsheetLocally(xlsxDataNew);

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'Extion ai',
        content: `${file.name} 파일이 성공적으로 업로드되었습니다.\n\n` +
          `파일 정보:\n` +
          result.sheets.map((sheet) => {
            const rawData = sheet.rawData || [[]];
            return `• ${sheet.sheetName}: ${rawData[0]?.length || 0}열 × ${rawData.length}행`;
          }).join('\n') +
          `\n\n데이터에 대해 궁금한 점이 있으시면 언제든 물어보세요!`,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, successMessage);
    }
  };

  // CSV 파일 처리
  const processCSVFile = async (file: File) => {
    const fileContent = await detectAndDecode(file);

    Papa.parse(fileContent, {
      header: false,
      skipEmptyLines: false,
      complete: async (results: Papa.ParseResult<unknown>) => {
        if (results.data && results.data.length > 0) {
          const rawData = results.data as string[][];

          if (rawData.length === 0) {
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'Extion ai',
              content: `⚠️ 파일에 데이터가 없습니다.`,
              timestamp: new Date()
            };
            addMessageToSheet(activeSheetIndex, errorMessage);
            return;
          }

          const rowCount = rawData.length;
          const columnCount = rawData[0]?.length || 0;

          const newSheetData = {
            sheetName: file.name.replace('.csv', ''),
            rawData: rawData,
            metadata: {
              rowCount: rowCount,
              columnCount: columnCount,
              dataRange: {
                startRow: 0,
                endRow: rowCount - 1,
                startCol: 0,
                endCol: columnCount > 0 ? columnCount - 1 : 0,
                startColLetter: columnIndexToLetter(0),
                endColLetter: columnIndexToLetter(columnCount > 0 ? columnCount - 1 : 0)
              },
              preserveOriginalStructure: true,
              lastModified: new Date()
            }
          };

          if (xlsxData) {
            // 기존 데이터에 새 시트 추가
            const newXlsxData = { ...xlsxData, sheets: [...xlsxData.sheets, newSheetData] };
            processSpreadsheetLocally(newXlsxData);

            const successMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'Extion ai',
              content: `${file.name} 파일이 새로운 시트로 추가되었습니다.\n\n` +
                `추가된 시트 정보:\n` +
                `• ${newSheetData.sheetName}: ${newSheetData.rawData[0]?.length || 0}열 × ${newSheetData.rawData.length}행`,
              timestamp: new Date()
            };
            addMessageToSheet(activeSheetIndex, successMessage);
          } else {
            // 새 데이터 생성
            const xlsxDataNew = {
              fileName: file.name,
              sheets: [newSheetData],
              activeSheetIndex: 0
            };

            processSpreadsheetLocally(xlsxDataNew);

            const successMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'Extion ai',
              content: `${file.name} 파일이 성공적으로 로드되었습니다.\n` +
                `${newSheetData.rawData[0]?.length || 0}열 × ${newSheetData.rawData.length}행의 데이터가 스프레드시트에 표시됩니다.`,
              timestamp: new Date()
            };
            addMessageToSheet(0, successMessage);
          }
        }
      },
      error: (error: Error) => {
        console.error('CSV 파싱 오류:', error);
        setError('fileError', error.message);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'Extion ai',
          content: `파일 처리 중 오류가 발생했습니다: ${error.message}`,
          timestamp: new Date()
        };
        addMessageToSheet(activeSheetIndex, errorMessage);
      }
    });
  };

  // 파일 처리 메인 함수
  const processFile = useCallback(async (file: File) => {
    setLoadingState('fileUpload', true);
    setError('fileError', null);
    setFileState(prev => ({ ...prev, isProcessing: true }));

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await processXLSXFileData(file);
      } else if (fileExtension === 'csv') {
        await processCSVFile(file);
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. CSV 또는 XLSX 파일을 업로드해주세요.');
      }
    } catch (error) {
      console.error('파일 읽기 오류:', error);
      setError('fileError', error instanceof Error ? error.message : '알 수 없는 오류');
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'Extion ai',
        content: `파일 읽기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date()
      };
      addMessageToSheet(activeSheetIndex, errorMessage);
    } finally {
      setLoadingState('fileUpload', false);
      setFileState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [activeSheetIndex, xlsxData]);

  // Drag and Drop 핸들러들
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!canUploadFile()) return;
    setFileState(prev => ({ ...prev, isDragOver: true }));
  }, [canUploadFile]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setFileState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setFileState(prev => ({ ...prev, isDragOver: false }));
    
    if (!canUploadFile()) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidSpreadsheetFile(droppedFile)) {
      processFile(droppedFile);
    }
  }, [canUploadFile, processFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidSpreadsheetFile(selectedFile)) {
      processFile(selectedFile);
    }
  }, [processFile]);

  return {
    fileState,
    processFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    isValidSpreadsheetFile
  };
}; 