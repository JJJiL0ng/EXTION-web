import { useState, useCallback, useMemo } from 'react';
import { 
  SelectedCellInfo, 
  HandsontableSettings, 
  ExportState, 
  SheetTabsState, 
  CellEditState 
} from '../types';
import { useUnifiedStore } from '@/stores';
import { cellAddressToCoords } from '@/stores/store-utils/xlsxUtils';

export const useSpreadsheetLogic = () => {
  // Zustand store
  const {
    xlsxData,
    activeSheetData,
    extendedSheetContext,
    loadingStates,
    currentSpreadsheetId,
    isInternalUpdate,
    setInternalUpdate,
    setLoadingState,
    pendingFormula,
    setPendingFormula,
    switchToSheet,
    updateActiveSheetCell,
    getCurrentSheetData,
    setXLSXData
  } = useUnifiedStore();

  // Local state
  const [selectedCellInfo, setSelectedCellInfo] = useState<SelectedCellInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Export state
  const [exportState, setExportState] = useState<ExportState>({
    isExportDropdownOpen: false,
    isXlsxSelectorOpen: false,
    selectedSheets: [],
    exportFileName: ''
  });

  // Sheet tabs state
  const [sheetTabsState, setSheetTabsState] = useState<SheetTabsState>({
    isSheetDropdownOpen: false,
    isCreateSheetModalOpen: false,
    newSheetName: '',
    scrollThumbPosition: 0,
    scrollThumbWidth: 30,
    isDragging: false,
    dragStartX: 0,
    dragStartScroll: 0,
    showScrollbar: false
  });

  // Cell edit state
  const [cellEditState, setCellEditState] = useState<CellEditState>({
    cellEditValue: '',
    isCellEditing: false
  });

  // 표시할 데이터 준비
  const displayData = useMemo(() => {
    if (!activeSheetData || !activeSheetData.headers || !activeSheetData.data) {
      const defaultRows = 100;
      const defaultCols = 26;
      return Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(''));
    }

    let baseData: any[][] = [];

    if (activeSheetData.rawData && activeSheetData.rawData.length > 0) {
      baseData = [...activeSheetData.rawData];
    } else {
      const currentData = getCurrentSheetData();
      baseData = [activeSheetData.headers, ...(currentData || activeSheetData.data)];
    }

    const currentRows = baseData.length;
    const currentCols = Math.max(...baseData.map(row => row?.length || 0));
    
    const targetRows = Math.max(100, currentRows + 50);
    const targetCols = Math.max(26, currentCols + 10);

    const expandedData = baseData.map(row => {
      const expandedRow = [...(row || [])];
      while (expandedRow.length < targetCols) {
        expandedRow.push('');
      }
      return expandedRow;
    });

    while (expandedData.length < targetRows) {
      expandedData.push(Array(targetCols).fill(''));
    }

    return expandedData;
  }, [activeSheetData, getCurrentSheetData]);

  // Handsontable 설정
  const handsontableSettings = useMemo((): HandsontableSettings => {
    const minRows = 100;
    const minCols = 26;
    
    if (!activeSheetData) {
      return {
        minRows,
        minCols,
        startRows: minRows,
        startCols: minCols,
        maxRows: 10000,
        maxCols: 100
      };
    }

    const rawRows = activeSheetData.rawData?.length || 0;
    const rawCols = activeSheetData.rawData?.[0]?.length || 0;
    
    const calculatedRows = Math.max(minRows, rawRows + 50);
    const calculatedCols = Math.max(minCols, rawCols + 10);

    return {
      minRows: calculatedRows,
      minCols: calculatedCols,
      startRows: calculatedRows,
      startCols: calculatedCols,
      maxRows: 10000,
      maxCols: 100
    };
  }, [activeSheetData]);

  // 시트 전환 핸들러
  const handleSheetChange = useCallback(async (sheetIndex: number) => {
    setLoadingState('sheetSwitch', true);
    try {
      await switchToSheet(sheetIndex);
      setSelectedCellInfo(null);
    } catch (error) {
      console.error('시트 전환 오류:', error);
    } finally {
      setLoadingState('sheetSwitch', false);
    }
  }, [switchToSheet, setLoadingState]);

  // 셀 선택 핸들러
  const handleCellSelection = useCallback((row: number, col: number) => {
    let value = '';
    let formula = '';
    let isHeader = false;
    let actualDataRow = row;
    let sheetName = 'Sheet1';

    try {
      if (xlsxData && activeSheetData) {
        sheetName = activeSheetData.sheetName;
        
        if (activeSheetData.rawData && activeSheetData.rawData.length > 0) {
          value = activeSheetData.rawData[row]?.[col] || '';
          
          if (activeSheetData.metadata && activeSheetData.metadata.headerRow !== undefined && activeSheetData.metadata.headerRow >= 0) {
            const headerRow = activeSheetData.metadata.headerRow;
            
            if (row === headerRow) {
              isHeader = true;
              actualDataRow = -1;
            } else if (row > headerRow) {
              actualDataRow = row - headerRow - 1;
            } else {
              actualDataRow = row;
            }
          } else {
            const dataRange = activeSheetData.metadata?.dataRange;
            if (dataRange && row >= dataRange.startRow) {
              actualDataRow = row - dataRange.startRow;
            } else {
              actualDataRow = row;
            }
          }
        } else {
          if (row === 0) {
            isHeader = true;
            actualDataRow = -1;
          } else {
            actualDataRow = row - 1;
          }
        }
      } else {
        actualDataRow = row;
        isHeader = false;
      }

      const colLetter = String.fromCharCode(65 + col);
      const cellAddress = `${colLetter}${row + 1}`;

      const cellInfo: SelectedCellInfo = {
        row: actualDataRow,
        col,
        cellAddress,
        value,
        formula: formula || undefined,
        sheetIndex: xlsxData?.activeSheetIndex ?? 0,
        timestamp: new Date()
      };

      setSelectedCellInfo(cellInfo);
    } catch (error) {
      console.error('Error getting cell info:', error);
    }
  }, [xlsxData, activeSheetData]);

  // 포뮬러 적용
  const applyFormulaToCell = useCallback((formula: string, cellAddress: string, hotInstance: any) => {
    if (!hotInstance) return;

    try {
      const { row, col } = cellAddressToCoords(cellAddress);
      const formulaValue = formula.startsWith('=') ? formula : `=${formula}`;
      
      hotInstance.setDataAtCell(row, col, formulaValue);
      
      setTimeout(() => {
        if (hotInstance && !hotInstance.isDestroyed) {
          try {
            hotInstance.render();
            
            if (xlsxData && activeSheetData) {
              const sheetIndex = xlsxData.activeSheetIndex;
              const dataRow = activeSheetData.metadata?.headerRow !== undefined && activeSheetData.metadata.headerRow >= 0 
                ? Math.max(0, row - activeSheetData.metadata.headerRow - 1)
                : row;
              
              if (dataRow >= 0) {
                updateActiveSheetCell(dataRow, col, formulaValue);
              }
            }
          } catch (error) {
            console.warn('포뮬러 적용 후 렌더링 중 오류 (무시됨):', error);
          }
        }
      }, 200);
    } catch (error) {
      console.error('포뮬러 적용 중 오류:', error);
    }
  }, [xlsxData, activeSheetData, updateActiveSheetCell]);

  return {
    // Store data
    xlsxData,
    activeSheetData,
    extendedSheetContext,
    loadingStates,
    currentSpreadsheetId,
    isInternalUpdate,
    pendingFormula,
    
    // Local state
    selectedCellInfo,
    isSidebarOpen,
    exportState,
    sheetTabsState,
    cellEditState,
    displayData,
    handsontableSettings,
    
    // State setters
    setSelectedCellInfo,
    setIsSidebarOpen,
    setExportState,
    setSheetTabsState,
    setCellEditState,
    setInternalUpdate,
    setPendingFormula,
    
    // Handlers
    handleSheetChange,
    handleCellSelection,
    applyFormulaToCell,
    
    // Store actions
    updateActiveSheetCell,
    getCurrentSheetData
  };
}; 