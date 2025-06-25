'use client'

import React, { useMemo, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import { useUnifiedStore } from '@/stores';
import { prepareDisplayData } from '@/utils/spreadsheetUtils';
import { EnhancedFormulaPlugin, EnhancedFormulaPluginTranslations } from '@/utils/EnhancedFormulaPlugin';
import { getHotTableSettings } from '@/config/handsontableSettings';
import { HandsontableStyles } from '@/config/handsontableStyles';
import { useAutosave } from '@/hooks/useAutosave';
import { useSpreadsheetLogic } from '@/hooks/useSpreadsheetLogic';
import { useCellEditor } from '@/hooks/useCellEditor';

// 컴포넌트 imports
import { TopControlPanel } from './spreadsheet/TopControlPanel';
import { SheetTabs } from './spreadsheet/SheetTabs';
import ChatSidebar from './chat/ChatSidebar';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';
import 'handsontable/languages/ko-KR'; // 한국어 언어팩 import

registerAllModules();

HyperFormula.registerFunctionPlugin(EnhancedFormulaPlugin, EnhancedFormulaPluginTranslations);

// 공유 HyperFormula 인스턴스 생성
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
  maxRows: 10000,
  maxColumns: 1000,
  useArrayArithmetic: true,
  useColumnIndex: true,
});

const MainSpreadSheet: React.FC = () => {
  // 자동 저장 훅 호출
  useAutosave();

  // 스프레드시트 핵심 로직 훅
  const {
    hotRef,
    selectedCellInfo,
    setSelectedCellInfo,
    isSidebarOpen,
    handleSheetChange,
    handleAfterChange,
    handleCellSelection,
    handleCellClick,
    toggleSidebar,
  } = useSpreadsheetLogic();

  // 셀 편집 훅
  const {
    cellEditValue,
    isCellEditing,
    setCellEditValue,
    setIsCellEditing,
    handleCellEditChange,
    handleCellEditSubmit,
    handleCellEditCancel,
    handleCellEditKeyDown,
  } = useCellEditor(selectedCellInfo, hotRef);

  // Zustand store 사용
  const {
    xlsxData,
    activeSheetData,
    loadingStates,
    isInternalUpdate,
    pendingFormula,
    setPendingFormula,
    currentSheetMetaDataId,
    saveStatus,
  } = useUnifiedStore();

  // HyperFormula 설정
  const formulasConfig = useMemo<DetailedSettings>(() => ({
    engine: hyperformulaInstance,
    namedExpressions: [],
    sheetName: activeSheetData?.sheetName || 'Sheet',
  }), [activeSheetData?.sheetName]);

  // Handsontable에 표시할 데이터를 준비
  const displayData = useMemo(() => {
    console.log('🔄 시트 데이터 변경으로 displayData 다시 계산:', activeSheetData?.sheetName);
    return prepareDisplayData(activeSheetData);
  }, [activeSheetData]);

  // Handsontable 설정
  const hotSettings = useMemo(() => getHotTableSettings({
    activeSheetData,
    formulasConfig,
    isInternalUpdate,
    handleAfterChange,
    handleCellSelection,
    hotRef
  }), [activeSheetData, formulasConfig, isInternalUpdate, handleAfterChange, handleCellSelection, hotRef]);

  // Handsontable 언어 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hot = hotRef.current?.hotInstance;
      if (hot) {
        hot.updateSettings({
          language: 'ko-KR' // 한국어 설정
        });
      }
    }
  }, []);

  // 개발 환경에서 상태 디버깅
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MainSpreadSheet 컴포넌트 상태:', {
        hasXlsxData: !!xlsxData,
        fileName: xlsxData?.fileName || 'No file',
        sheetsCount: xlsxData?.sheets?.length || 0,
        activeSheetIndex: xlsxData?.activeSheetIndex ?? 0,
        activeSheetName: xlsxData?.sheets?.[xlsxData?.activeSheetIndex || 0]?.sheetName || '시트 (default)',
        currentSheetMetaDataId: currentSheetMetaDataId || 'None',
        hasActiveSheetData: !!activeSheetData,
        displayDataLength: displayData.length,
        displayDataCols: displayData[0]?.length || 0,
        isEmptySpreadsheet: !xlsxData && !activeSheetData
      });

      if (xlsxData?.sheets) {
        xlsxData.sheets.forEach((sheet, index) => {
          console.log(`📋 시트 ${index}:`, {
            index,
            name: sheet.sheetName,
            rows: sheet.rawData?.length || 0,
            cols: sheet.rawData?.[0]?.length || 0,
            isActive: index === (xlsxData.activeSheetIndex || 0)
          });
        });
      } else {
        console.log('📋 기본 빈 시트 표시 중:', {
          sheetName: '시트',
          rows: displayData.length,
          cols: displayData[0]?.length || 0,
          isEmpty: true
        });
      }
    }
  }, [xlsxData, activeSheetData, displayData, currentSheetMetaDataId]);

  // 시트 변경 시에만 Handsontable 데이터 업데이트
  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (hot && displayData && displayData.length > 0) {
      console.log('🔄 시트 변경 감지 - displayData 업데이트:', {
        activeSheetIndex: xlsxData?.activeSheetIndex,
        activeSheetName: activeSheetData?.sheetName,
        displayDataRows: displayData.length,
        displayDataCols: displayData[0]?.length || 0,
        lastModified: activeSheetData?.metadata?.lastModified,
      });

      // displayData를 Handsontable에 로드
      hot.loadData(displayData);

      // 추가 렌더링으로 확실하게 업데이트
      const timeoutId = setTimeout(() => {
        const currentHot = hotRef.current?.hotInstance;
        if (currentHot && !currentHot.isDestroyed) {
          try {
            currentHot.render();
            console.log('✅ 시트 변경 데이터 업데이트 완료');
          } catch (error) {
            console.warn('Handsontable 렌더링 중 오류 (무시됨):', error);
          }
        }
      }, 50);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [xlsxData?.activeSheetIndex, activeSheetData?.sheetName, activeSheetData?.metadata?.lastModified, displayData]);

  // 스프레드시트 데이터 변경 시 선택된 셀 정보 초기화
  useEffect(() => {
    console.log('📋 스프레드시트 데이터 변경 감지 - 선택된 셀 정보 초기화');
    setSelectedCellInfo(null);
    setCellEditValue('');
    setIsCellEditing(false);
  }, [xlsxData, activeSheetData, setSelectedCellInfo, setCellEditValue, setIsCellEditing]);

  // 빈 시트 상태에서 기본 컨텍스트 생성 및 데이터 변경 감지
  useEffect(() => {
    // 시트가 없고 채팅이 가능한 상태에서 기본 시트 컨텍스트 설정
    if (!xlsxData && !activeSheetData && !loadingStates.fileUpload) {
      console.log('🔧 빈 시트 상태에서 기본 컨텍스트 초기화');
      console.log('빈 스프레드시트 환경 준비 완료');
    }
  }, [xlsxData, activeSheetData, loadingStates.fileUpload]);

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
      {/* 사이드바 */}
      <ChatSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* 메인 스프레드시트 영역 - 사이드바 상태에 따른 마진 조정 */}
      <div className={`h-full flex flex-col flex-1 min-w-0 spreadsheet-container transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-80' : 'ml-0'
      }`}>
        {/* Handsontable z-index 문제 해결을 위한 스타일 */}
        <HandsontableStyles />

        {/* 상단 컨트롤 패널 */}
        <TopControlPanel
          selectedCellInfo={selectedCellInfo}
          cellEditValue={cellEditValue}
          isCellEditing={isCellEditing}
          pendingFormula={pendingFormula}
          currentSheetMetaDataId={currentSheetMetaDataId}
          saveStatus={saveStatus}
          onCellEditChange={handleCellEditChange}
          onCellEditSubmit={handleCellEditSubmit}
          onCellEditCancel={handleCellEditCancel}
          onCellEditKeyDown={handleCellEditKeyDown}
          onSetCellEditing={setIsCellEditing}
          onSetPendingFormula={setPendingFormula}
          xlsxData={xlsxData}
          activeSheetData={activeSheetData}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {/* 시트 탭 바 */}
        <SheetTabs
          xlsxData={xlsxData}
          onSheetChange={handleSheetChange}
          loadingStates={loadingStates}
        />

        {/* 스프레드시트 영역 - flex-1로 남은 공간 모두 사용 */}
        <div className="flex-1 bg-white shadow-inner overflow-hidden" style={{ position: 'relative', zIndex: 50 }}>
          <HotTable
            ref={hotRef}
            data={displayData}
            {...(hotSettings as any)}
          />
        </div>
      </div>
    </div>
  );
};

export default MainSpreadSheet; 