'use client'

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { useUnifiedStore } from '@/stores';
import ChatSidebar from './chat/ChatSidebar';
import { CustomFormulaPlugin, CustomFormulaPluginTranslations } from '@/utils/CustomFormulaPlugin';

// 분할된 컴포넌트들
import HandsontableStyles from './sheet/HandsontableStyles';
import ExportControls from './sheet/ExportControls';
import CellInfoBar from './sheet/CellInfoBar';
import SheetTabs from './sheet/SheetTabs';
import SpreadsheetArea, { SpreadsheetAreaRef } from './sheet/SpreadsheetArea';

// 커스텀 훅들
import { useSpreadsheetLogic } from './sheet/hooks/useSpreadsheetLogic';
import { useExportHandlers } from './sheet/hooks/useExportHandlers';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

registerAllModules();

HyperFormula.registerFunctionPlugin(CustomFormulaPlugin, CustomFormulaPluginTranslations);

// 공유 HyperFormula 인스턴스 생성
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
  maxRows: 10000,
  maxColumns: 1000,
  useArrayArithmetic: true,
  useColumnIndex: true,
});

const MainSpreadSheet: React.FC = () => {
  const spreadsheetRef = useRef<SpreadsheetAreaRef>(null);
  
  // 커스텀 훅 사용
  const {
    xlsxData,
    activeSheetData,
    extendedSheetContext,
    loadingStates,
    isInternalUpdate,
    pendingFormula,
    selectedCellInfo,
    isSidebarOpen,
    exportState,
    sheetTabsState,
    cellEditState,
    displayData,
    handsontableSettings,
    setSelectedCellInfo,
    setIsSidebarOpen,
    setExportState,
    setSheetTabsState,
    setCellEditState,
    setInternalUpdate,
    setPendingFormula,
    handleSheetChange,
    handleCellSelection,
    applyFormulaToCell,
    updateActiveSheetCell,
    getCurrentSheetData
  } = useSpreadsheetLogic();

  // 내보내기 핸들러
  const exportHandlers = useExportHandlers({
    xlsxData,
    activeSheetData,
    exportState,
    setExportState,
    getCurrentSheetData
  });

  // HyperFormula 설정
  const formulasConfig = useMemo<DetailedSettings>(() => ({
    engine: hyperformulaInstance,
    namedExpressions: [],
    sheetName: extendedSheetContext?.sheetName || 'Sheet1',
  }), [extendedSheetContext]);

  // 포뮬러 적용 useEffect
  useEffect(() => {
    if (pendingFormula && spreadsheetRef.current) {
      const hotInstance = spreadsheetRef.current.getHotInstance();
      
      if (hotInstance) {
        console.log('포뮬러 적용:', pendingFormula);
        setInternalUpdate(true);

        const targetSheetIndex = pendingFormula.sheetIndex ?? xlsxData?.activeSheetIndex ?? 0;

        if (targetSheetIndex === xlsxData?.activeSheetIndex) {
          applyFormulaToCell(pendingFormula.formula, pendingFormula.cellAddress, hotInstance);

          setTimeout(() => {
            setPendingFormula(null);
            setInternalUpdate(false);
          }, 200);
        } else {
          setPendingFormula(null);
          setInternalUpdate(false);
        }
      }
    }
  }, [pendingFormula, setPendingFormula, setInternalUpdate, xlsxData, applyFormulaToCell]);

  // afterChange 핸들러
  const handleAfterChange = useCallback((
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (isInternalUpdate || source === 'loadData') {
      return;
    }

    if (changes && activeSheetData) {
      changes.forEach(([row, col, , newValue]) => {
        if (typeof row === 'number' && typeof col === 'number') {
          if (activeSheetData.metadata && activeSheetData.metadata.headerRow !== undefined) {
            const headerRow = activeSheetData.metadata.headerRow;

            if (headerRow >= 0 && row > headerRow) {
              const dataRow = row - headerRow - 1;
              if (dataRow >= 0) {
                updateActiveSheetCell(dataRow, col, newValue?.toString() || '');
              }
            } else if (headerRow === -1 || row < headerRow) {
              updateActiveSheetCell(row, col, newValue?.toString() || '');
            }
          } else {
            updateActiveSheetCell(row, col, newValue?.toString() || '');
          }
        }
      });
    }
  }, [isInternalUpdate, activeSheetData, updateActiveSheetCell]);

  // 셀 편집 핸들러들
  const handleCellEditChange = useCallback((value: string) => {
    setCellEditState(prev => ({ ...prev, cellEditValue: value }));
  }, [setCellEditState]);

  const handleCellEditSubmit = useCallback(() => {
    if (!selectedCellInfo || !spreadsheetRef.current) return;

    const hotInstance = spreadsheetRef.current.getHotInstance();
    if (!hotInstance) return;

    try {
      const actualRow = selectedCellInfo.row >= 0 ? selectedCellInfo.row + 1 : 0;
      hotInstance.setDataAtCell(actualRow, selectedCellInfo.col, cellEditState.cellEditValue);
      
      setCellEditState(prev => ({ ...prev, isCellEditing: false }));
      
      setTimeout(() => {
        hotInstance.render();
      }, 100);
    } catch (error) {
      console.error('Error updating cell:', error);
    }
  }, [selectedCellInfo, cellEditState.cellEditValue, setCellEditState]);

  const handleCellEditCancel = useCallback(() => {
    if (selectedCellInfo) {
      setCellEditState(prev => ({
        ...prev,
        cellEditValue: selectedCellInfo.formula || selectedCellInfo.value?.toString() || '',
        isCellEditing: false
      }));
    }
  }, [selectedCellInfo, setCellEditState]);

  const handleCellEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellEditSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellEditCancel();
    }
  }, [handleCellEditSubmit, handleCellEditCancel]);

  const handleCellEditFocus = useCallback(() => {
    setCellEditState(prev => ({ ...prev, isCellEditing: true }));
  }, [setCellEditState]);

  // 셀 선택이 변경될 때 편집 값 업데이트
  useEffect(() => {
    if (selectedCellInfo) {
      setCellEditState(prev => ({
        ...prev,
        cellEditValue: selectedCellInfo.formula || selectedCellInfo.value?.toString() || '',
        isCellEditing: false
      }));
    }
  }, [selectedCellInfo, setCellEditState]);

  // 사이드바 토글
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 시트 탭 관련 핸들러들 (임시로 빈 함수들)
  const handleCreateSheet = () => {
    console.log('Create sheet functionality would go here');
  };

  const handleSetNewSheetName = (name: string) => {
    setSheetTabsState(prev => ({ ...prev, newSheetName: name }));
  };

  const handleToggleCreateSheetModal = () => {
    setSheetTabsState(prev => ({ 
      ...prev, 
      isCreateSheetModalOpen: !prev.isCreateSheetModalOpen,
      newSheetName: prev.isCreateSheetModalOpen ? '' : prev.newSheetName
    }));
  };

  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Scrollbar click:', e);
  };

  const handleThumbDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Thumb drag start:', e);
  };

  // 로딩 중일 때 표시
  if (loadingStates.fileUpload) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">파일을 처리하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex relative spreadsheet-main-container">
      {/* 글로벌 스타일 */}
      <HandsontableStyles />
      
      {/* 사이드바 */}
      <ChatSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* 메인 스프레드시트 영역 */}
      <div className={`h-full flex flex-col flex-1 min-w-0 spreadsheet-container transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-80' : 'ml-0'
      }`}>
        {/* 상단 컨트롤 패널 */}
        <div className="example-controls-container bg-[#F9F9F7] border-b border-gray-200 p-2 shadow-sm flex-shrink-0" style={{ position: 'relative', zIndex: 9000 }}>
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <div className="flex items-center space-x-3">
              {/* 햄버거 버튼 주석처리 */}
              {/*
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200 flex-shrink-0"
                aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
                style={{ minWidth: '40px', height: '40px' }}
              >
                <div className="flex flex-col space-y-1">
                  <div 
                    className={`w-5 h-0.5 bg-gray-600 transition-transform duration-300 ${
                      isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`}
                  />
                  <div 
                    className={`w-5 h-0.5 bg-gray-600 transition-opacity duration-300 ${
                      isSidebarOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <div 
                    className={`w-5 h-0.5 bg-gray-600 transition-transform duration-300 ${
                      isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''
                    }`}
                  />
                </div>
              </button>
              */}
              
              {/* EXTION 텍스트 로고 */}
              <h1 className="text-xl font-bold text-gray-800" style={{ color: '#005DE9' }}>
                EXTION
              </h1>
            </div>

            {/* 셀 정보 바 */}
            <CellInfoBar
              selectedCellInfo={selectedCellInfo}
              cellEditState={cellEditState}
              onCellEditChange={handleCellEditChange}
              onCellEditSubmit={handleCellEditSubmit}
              onCellEditCancel={handleCellEditCancel}
              onCellEditKeyDown={handleCellEditKeyDown}
              onCellEditFocus={handleCellEditFocus}
            />

            {/* 내보내기 컨트롤 */}
            <ExportControls
              exportState={exportState}
              xlsxData={xlsxData}
              activeSheetData={activeSheetData}
              onExportToCSV={exportHandlers.handleExportToCSV}
              onExportToXLSX={exportHandlers.handleExportToXLSX}
              onToggleExportDropdown={exportHandlers.toggleExportDropdown}
              onToggleXlsxSelector={exportHandlers.toggleXlsxSelector}
              onToggleSheetSelection={exportHandlers.toggleSheetSelection}
              onToggleAllSheets={exportHandlers.toggleAllSheets}
              onExecuteXlsxExport={exportHandlers.executeXlsxExport}
              onSetExportFileName={exportHandlers.setExportFileName}
            />
          </div>

          {/* 포뮬러 적용 대기 알림 */}
          {pendingFormula && (
            <div className="rounded-xl p-4 mt-4" 
                 style={{ 
                   backgroundColor: 'rgba(0, 93, 233, 0.08)', 
                   borderColor: 'rgba(0, 93, 233, 0.2)',
                   border: '1px solid'
                 }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#005DE9' }}>
                    포뮬러 적용 대기 중
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(0, 93, 233, 0.8)' }}>
                    {pendingFormula.cellAddress}에 {pendingFormula.formula} 적용
                    {pendingFormula.sheetIndex !== undefined &&
                      ` (시트 ${xlsxData?.sheets[pendingFormula.sheetIndex]?.sheetName || pendingFormula.sheetIndex})`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setPendingFormula(null)}
                  className="text-sm bg-white px-3 py-1.5 rounded-lg border transition-colors duration-200"
                  style={{ 
                    color: '#005DE9',
                    borderColor: 'rgba(0, 93, 233, 0.2)'
                  }}
                  type="button"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 시트 탭 바 */}
        <SheetTabs
          xlsxData={xlsxData}
          sheetTabsState={sheetTabsState}
          onSheetChange={handleSheetChange}
          onCreateSheet={handleCreateSheet}
          onSetNewSheetName={handleSetNewSheetName}
          onToggleCreateSheetModal={handleToggleCreateSheetModal}
          onScrollbarClick={handleScrollbarClick}
          onThumbDragStart={handleThumbDragStart}
          loadingStates={loadingStates}
        />

        {/* 스프레드시트 영역 */}
        <SpreadsheetArea
          ref={spreadsheetRef}
          displayData={displayData}
          formulasConfig={formulasConfig}
          handsontableSettings={handsontableSettings}
          onAfterChange={handleAfterChange}
          onCellSelection={handleCellSelection}
        />
      </div>
    </div>
  );
};

export default MainSpreadSheet; 