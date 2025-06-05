import { useCallback } from 'react';
import { ExportState } from '../types';
import { XLSXData, SheetData } from '@/stores/store-types';
import { exportActiveSheetToCSV, exportSelectedSheetsToXLSX } from '@/utils/exportUtils';

interface UseExportHandlersProps {
  xlsxData: XLSXData | null;
  activeSheetData: SheetData | null;
  exportState: ExportState;
  setExportState: (state: ExportState | ((prev: ExportState) => ExportState)) => void;
  getCurrentSheetData: () => any[][] | null;
}

export const useExportHandlers = ({
  xlsxData,
  activeSheetData,
  exportState,
  setExportState,
  getCurrentSheetData
}: UseExportHandlersProps) => {

  // 내보내기 드롭다운 토글
  const toggleExportDropdown = useCallback(() => {
    setExportState(prev => ({
      ...prev,
      isExportDropdownOpen: !prev.isExportDropdownOpen,
      isXlsxSelectorOpen: false // 다른 모달 닫기
    }));
  }, [setExportState]);

  // XLSX 선택기 토글
  const toggleXlsxSelector = useCallback(() => {
    setExportState(prev => ({
      ...prev,
      isXlsxSelectorOpen: !prev.isXlsxSelectorOpen,
      selectedSheets: prev.isXlsxSelectorOpen ? [] : prev.selectedSheets,
      exportFileName: prev.isXlsxSelectorOpen ? '' : prev.exportFileName
    }));
  }, [setExportState]);

  // CSV 내보내기
  const handleExportToCSV = useCallback(() => {
    if (!activeSheetData) return;

    const currentData = getCurrentSheetData() || activeSheetData.data;

    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `${activeSheetData.sheetName}_${dateStr}.csv`;

      exportActiveSheetToCSV({
        sheetName: activeSheetData.sheetName,
        headers: activeSheetData.headers,
        data: currentData
      }, fileName);

      setExportState(prev => ({ ...prev, isExportDropdownOpen: false }));
    } catch (error) {
      console.error('CSV 내보내기 오류:', error);
      alert('CSV 파일로 내보내는 중 오류가 발생했습니다.');
    }
  }, [activeSheetData, getCurrentSheetData, setExportState]);

  // XLSX 내보내기 준비
  const handleExportToXLSX = useCallback(() => {
    if (!xlsxData) return;

    try {
      if (exportState.selectedSheets.length === 0) {
        setExportState(prev => ({
          ...prev,
          isXlsxSelectorOpen: true,
          selectedSheets: xlsxData.sheets.map((_, index) => index)
        }));

        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const baseFileName = xlsxData.fileName.replace(/\.[^/.]+$/, '') || 'export';
        
        setExportState(prev => ({
          ...prev,
          exportFileName: `${baseFileName}_${dateStr}`
        }));
      } else {
        executeXlsxExport();
      }
    } catch (error) {
      console.error('XLSX 내보내기 오류:', error);
      alert('XLSX 파일로 내보내는 중 오류가 발생했습니다.');
    }
  }, [xlsxData, exportState.selectedSheets, setExportState]);

  // XLSX 내보내기 실행
  const executeXlsxExport = useCallback(() => {
    if (!xlsxData || exportState.selectedSheets.length === 0) return;

    try {
      let finalFileName = exportState.exportFileName;
      if (!finalFileName.includes('_202')) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        finalFileName = `${finalFileName}_${dateStr}`;
      }

      exportSelectedSheetsToXLSX(
        xlsxData,
        exportState.selectedSheets,
        finalFileName ? `${finalFileName}.xlsx` : undefined
      );

      setExportState(prev => ({
        ...prev,
        isXlsxSelectorOpen: false,
        isExportDropdownOpen: false,
        selectedSheets: [],
        exportFileName: ''
      }));
    } catch (error) {
      console.error('XLSX 내보내기 오류:', error);
      alert('XLSX 파일로 내보내는 중 오류가 발생했습니다.');
    }
  }, [xlsxData, exportState, setExportState]);

  // 시트 선택 토글
  const toggleSheetSelection = useCallback((sheetIndex: number) => {
    setExportState(prev => ({
      ...prev,
      selectedSheets: prev.selectedSheets.includes(sheetIndex)
        ? prev.selectedSheets.filter(index => index !== sheetIndex)
        : [...prev.selectedSheets, sheetIndex]
    }));
  }, [setExportState]);

  // 모든 시트 선택/해제
  const toggleAllSheets = useCallback(() => {
    if (!xlsxData) return;

    setExportState(prev => ({
      ...prev,
      selectedSheets: prev.selectedSheets.length === xlsxData.sheets.length
        ? []
        : xlsxData.sheets.map((_, index) => index)
    }));
  }, [xlsxData, setExportState]);

  // 파일명 설정
  const setExportFileName = useCallback((fileName: string) => {
    setExportState(prev => ({
      ...prev,
      exportFileName: fileName
    }));
  }, [setExportState]);

  return {
    toggleExportDropdown,
    toggleXlsxSelector,
    handleExportToCSV,
    handleExportToXLSX,
    executeXlsxExport,
    toggleSheetSelection,
    toggleAllSheets,
    setExportFileName
  };
}; 