'use client'

import { useState, useCallback, useEffect } from 'react';
import { exportActiveSheetToCSV, exportSelectedSheetsToXLSX } from '@/utils/exportUtils';
import { useUnifiedStore } from '@/stores';

export const useExportControls = (xlsxData: any, activeSheetData: any) => {
  const { getCurrentSheetData } = useUnifiedStore();
  
  // 내보내기 관련 상태
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isXlsxSelectorOpen, setIsXlsxSelectorOpen] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<number[]>([]);
  const [exportFileName, setExportFileName] = useState('');

  // CSV 내보내기 핸들러
  const handleExportToCSV = useCallback(() => {
    if (!activeSheetData) return;

    // 현재 시트 데이터 가져오기 (계산된 값 포함)
    const currentData = getCurrentSheetData() || activeSheetData.rawData;
    if (!currentData) return;

    try {
      // 파일명에 현재 날짜와 시간 추가
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `${activeSheetData.sheetName}_${dateStr}.csv`;

      // CSV로 내보내기 (헤더 없이 rawData 전체를 전달)
      exportActiveSheetToCSV({
        sheetName: activeSheetData.sheetName,
        headers: [],
        data: currentData
      }, fileName);

      // 내보내기 드롭다운 닫기
      setIsExportDropdownOpen(false);
    } catch (error) {
      console.error('CSV 내보내기 오류:', error);
      alert('CSV 파일로 내보내는 중 오류가 발생했습니다.');
    }
  }, [activeSheetData, getCurrentSheetData]);

  // XLSX 내보내기 핸들러
  const handleExportToXLSX = useCallback(() => {
    if (!xlsxData) return;

    try {
      // 시트 선택기를 열거나 바로 내보내기
      if (selectedSheets.length === 0) {
        setIsXlsxSelectorOpen(true);

        // 기본적으로 모든 시트 선택
        const allSheetIndices = xlsxData.sheets.map((_: any, index: number) => index);
        setSelectedSheets(allSheetIndices);

        // 현재 날짜와 시간을 포함한 기본 파일명 설정
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const baseFileName = xlsxData.fileName.replace(/\.[^/.]+$/, '') || 'export';
        setExportFileName(`${baseFileName}_${dateStr}`);
      } else {
        // 이미 시트가 선택된 상태라면 바로 내보내기
        const xlsxDataForExport = {
          ...xlsxData,
          sheets: xlsxData.sheets.map((sheet: any) => ({
            sheetName: sheet.sheetName,
            headers: [],
            data: sheet.rawData || [[]],
          }))
        };
        exportSelectedSheetsToXLSX(
          xlsxDataForExport,
          selectedSheets,
          exportFileName ? `${exportFileName}.xlsx` : undefined
        );

        // 상태 초기화
        setIsXlsxSelectorOpen(false);
        setIsExportDropdownOpen(false);
        setSelectedSheets([]);
        setExportFileName('');
      }
    } catch (error) {
      console.error('XLSX 내보내기 오류:', error);
      alert('XLSX 파일로 내보내는 중 오류가 발생했습니다.');
    }
  }, [xlsxData, selectedSheets, exportFileName]);

  // XLSX 내보내기 실행 핸들러
  const executeXlsxExport = useCallback(() => {
    if (!xlsxData || selectedSheets.length === 0) return;

    try {
      // 파일명에 날짜가 없는 경우 추가
      let finalFileName = exportFileName;
      if (!finalFileName.includes('_202')) { // 날짜 형식이 없는 경우
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        finalFileName = `${finalFileName}_${dateStr}`;
      }

      const xlsxDataForExport = {
        ...xlsxData,
        sheets: xlsxData.sheets.map((sheet: any) => ({
          sheetName: sheet.sheetName,
          headers: [],
          data: sheet.rawData || [[]],
        }))
      };
      exportSelectedSheetsToXLSX(
        xlsxDataForExport,
        selectedSheets,
        finalFileName ? `${finalFileName}.xlsx` : undefined
      );

      // 상태 초기화
      setIsXlsxSelectorOpen(false);
      setIsExportDropdownOpen(false);
      setSelectedSheets([]);
      setExportFileName('');
    } catch (error) {
      console.error('XLSX 내보내기 오류:', error);
      alert('XLSX 파일로 내보내는 중 오류가 발생했습니다.');
    }
  }, [xlsxData, selectedSheets, exportFileName]);

  // 선택된 시트 토글 핸들러
  const toggleSheetSelection = useCallback((sheetIndex: number) => {
    setSelectedSheets(prev => {
      if (prev.includes(sheetIndex)) {
        return prev.filter(index => index !== sheetIndex);
      } else {
        return [...prev, sheetIndex];
      }
    });
  }, []);

  // 모든 시트 선택/해제 핸들러
  const toggleAllSheets = useCallback(() => {
    if (!xlsxData) return;

    if (selectedSheets.length === xlsxData.sheets.length) {
      // 모든 시트가 선택된 상태이면 모두 해제
      setSelectedSheets([]);
    } else {
      // 아니면 모든 시트 선택
      const allSheetIndices = xlsxData.sheets.map((_: any, index: number) => index);
      setSelectedSheets(allSheetIndices);
    }
  }, [xlsxData, selectedSheets]);

  // Export 드롭다운과 XLSX 시트 선택기 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 내보내기 드롭다운
      const exportDropdown = document.querySelector('.export-dropdown');
      const exportButton = document.querySelector('.export-button');

      if (
        isExportDropdownOpen &&
        exportDropdown &&
        !exportDropdown.contains(target) &&
        exportButton &&
        !exportButton.contains(target)
      ) {
        setIsExportDropdownOpen(false);
      }

      // XLSX 시트 선택기
      const xlsxSelector = document.querySelector('.xlsx-sheet-selector');

      if (
        isXlsxSelectorOpen &&
        xlsxSelector &&
        !xlsxSelector.contains(target) &&
        exportDropdown &&
        !exportDropdown.contains(target)
      ) {
        setIsXlsxSelectorOpen(false);
        setSelectedSheets([]);
        setExportFileName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportDropdownOpen, isXlsxSelectorOpen]);

  return {
    isExportDropdownOpen,
    isXlsxSelectorOpen,
    selectedSheets,
    exportFileName,
    setIsExportDropdownOpen,
    setIsXlsxSelectorOpen,
    setSelectedSheets,
    setExportFileName,
    handleExportToCSV,
    handleExportToXLSX,
    executeXlsxExport,
    toggleSheetSelection,
    toggleAllSheets,
  };
}; 