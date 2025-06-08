//Src/components/MainSpreadSheet.tsx
'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { ChevronDown, Layers, ChevronLeft, ChevronRight, Plus, Save, Download, FileDown, MessageCircleIcon } from 'lucide-react';
import { useUnifiedStore } from '@/stores';
import { cellAddressToCoords } from '@/stores/store-utils/xlsxUtils';
import { XLSXData, SheetData } from '@/stores/store-types';
import { exportActiveSheetToCSV, exportSelectedSheetsToXLSX } from '@/utils/exportUtils';
import { getSpreadsheetData } from '@/services/firebase/spreadsheetService';
import ChatSidebar from './chat/ChatSidebar';
import Image from 'next/image';
import { EnhancedFormulaPlugin, EnhancedFormulaPluginTranslations } from '@/utils/EnhancedFormulaPlugin';
import { getHotTableSettings } from '@/config/handsontableSettings';
import { HandsontableStyles } from '@/config/handsontableStyles';
import { useAutosave } from '@/hooks/useAutosave';
import { AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';


import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

// Handsontable z-index 문제 해결을 위한 스타일
import { createGlobalStyle } from 'styled-components';

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

// Handsontable에 표시할 데이터를 준비하는 헬퍼 함수
const prepareDisplayData = (sheetData: SheetData | null): any[][] => {
    // 시트 데이터가 없으면 기본 빈 시트 생성 (100행 x 26열)
    if (!sheetData || !sheetData.rawData || sheetData.rawData.length === 0) {
        const defaultRows = 100;
        const defaultCols = 26; // A-Z
        return Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(''));
    }

    const baseData = sheetData.rawData;

    // 엑셀처럼 추가적인 빈 행과 열을 제공하여 사용성 개선
    const currentRows = baseData.length;
    // 현재 데이터의 최대 열 개수 계산 (빈 배열 방지)
    const currentCols = Math.max(0, ...baseData.map(row => (row || []).length));
    
    // 최소 100행, 26열(A-Z)을 보장하고, 현재 데이터보다 50행, 10열을 더 추가
    const targetRows = Math.max(100, currentRows + 50);
    const targetCols = Math.max(26, currentCols + 10);

    // 기존 데이터의 각 행을 목표 열 수만큼 확장
    const expandedData = baseData.map(row => {
        const expandedRow = [...(row || [])];
        while (expandedRow.length < targetCols) {
            expandedRow.push('');
        }
        return expandedRow;
    });

    // 목표 행 수만큼 추가 빈 행 생성
    while (expandedData.length < targetRows) {
        expandedData.push(Array(targetCols).fill(''));
    }

    return expandedData;
};

// CSV 데이터가 없을 때의 기본 설정
const defaultData = Array(100).fill(null).map(() => Array(26).fill(''));

// 선택된 셀 정보 인터페이스 업데이트 - timestamp 속성 추가
interface SelectedCellInfo {
  row: number;
  col: number;
  cellAddress: string;
  value: any;
  formula?: string;
  sheetIndex: number;
  timestamp: Date;
}

const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [isSheetDropdownOpen, setIsSheetDropdownOpen] = useState(false);
  const [selectedCellInfo, setSelectedCellInfo] = useState<SelectedCellInfo | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isCreateSheetModalOpen, setIsCreateSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  
  // 사이드바 상태 추가
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 셀 편집을 위한 상태 추가
  const [cellEditValue, setCellEditValue] = useState('');
  const [isCellEditing, setIsCellEditing] = useState(false);

  // 자동 저장 훅 호출
  useAutosave();

  // 스크롤바 관련 상태
  const [scrollThumbPosition, setScrollThumbPosition] = useState(0);
  const [scrollThumbWidth, setScrollThumbWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  // 내보내기 관련 상태 추가
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isXlsxSelectorOpen, setIsXlsxSelectorOpen] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<number[]>([]);
  const [exportFileName, setExportFileName] = useState('');

  // Zustand store 사용
  const {
    xlsxData,
    activeSheetData,
    loadingStates,
    errors,
    computedSheetData,
    hasUploadedFile,
    canUploadFile,
    setXLSXData,
    switchToSheet,
    updateActiveSheetCell,
    addMessageToSheet,
    getCurrentSheetData,
    currentSpreadsheetId,
    isInternalUpdate,
    setInternalUpdate,
    setLoadingState,
    pendingFormula,
    setPendingFormula,
    applyPendingFormulaToSheet,
    setError,
    saveStatus,
  } = useUnifiedStore();

  // 추가 상태 관리
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const [isAutosave] = useState<boolean>(true);

  // 현재 활성 시트 인덱스 계산 (시트가 없을 때는 0)
  const activeSheetIndex = xlsxData?.activeSheetIndex ?? 0;

  // HyperFormula 설정
  const [formulasConfig] = useState<DetailedSettings>({
    engine: hyperformulaInstance,
    namedExpressions: [],
    sheetName: activeSheetData?.sheetName || 'Sheet',
  });

  // Handsontable에 표시할 데이터를 준비. activeSheetData가 변경될 때만 다시 계산.
  const displayData = useMemo(() => {
    console.log('🔄 시트 데이터 변경으로 displayData 다시 계산:', activeSheetData?.sheetName);
    return prepareDisplayData(activeSheetData);
  }, [activeSheetData]);

  // 시트 전환 핸들러
  const handleSheetChange = useCallback(async (sheetIndex: number) => {
    console.log('=== 시트 전환 시작 ===');
    console.log('전환 정보:', {
      fromIndex: xlsxData?.activeSheetIndex,
      toIndex: sheetIndex,
      totalSheets: xlsxData?.sheets.length,
      targetSheetName: xlsxData?.sheets[sheetIndex]?.sheetName
    });

    setLoadingState('sheetSwitch', true);
    try {
      await switchToSheet(sheetIndex);
      setIsSheetDropdownOpen(false);

      // 시트 전환 시 선택된 셀 정보 초기화
      setSelectedCellInfo(null);

      console.log('✅ 시트 전환 완료:', {
        newActiveIndex: sheetIndex,
        sheetName: xlsxData?.sheets[sheetIndex]?.sheetName
      });

      // Handsontable 인스턴스 재렌더링
      setTimeout(() => {
        const currentHot = hotRef.current?.hotInstance;
        if (currentHot && !currentHot.isDestroyed) {
          try {
            currentHot.render();
            console.log('Handsontable 재렌더링 완료');
          } catch (error) {
            console.warn('Handsontable 재렌더링 중 오류 (무시됨):', error);
          }
        }
      }, 100);
    } catch (error) {
      console.error('❌ 시트 전환 오류:', error);
    } finally {
      setLoadingState('sheetSwitch', false);
    }
  }, [switchToSheet, setLoadingState, xlsxData]);

  // 셀에 함수를 적용하는 함수
  const applyFormulaToCell = useCallback((formula: string, cellAddress: string) => {
    console.log('🚀 applyFormulaToCell 시작:', { formula, cellAddress });
    
    const hot = hotRef.current?.hotInstance;
    if (!hot) {
      console.error('❌ Handsontable 인스턴스를 찾을 수 없습니다.');
      return;
    }

    console.log('✅ Handsontable 인스턴스 확인됨');

    try {
      console.log('🔄 포뮬러 적용 시작:', { formula, cellAddress });
      
      // 셀 주소를 좌표로 변환
      const { row, col } = cellAddressToCoords(cellAddress);
      console.log('🎯 변환된 좌표:', { row, col, from: cellAddress });
      
      // 현재 셀 값 확인
      const currentValue = hot.getDataAtCell(row, col);
      console.log('📋 현재 셀 값:', currentValue);
      
      // 포뮬러가 =로 시작하지 않으면 추가
      const formulaValue = formula.startsWith('=') ? formula : `=${formula}`;
      console.log('📝 적용할 포뮬러:', formulaValue);
      
      // Handsontable에 포뮬러 적용
      console.log('⚡ Handsontable에 데이터 설정 중...');
      hot.setDataAtCell(row, col, formulaValue);
      
      // 적용 후 값 확인
      setTimeout(() => {
        const afterValue = hot.getDataAtCell(row, col);
        console.log('🔍 적용 후 셀 값:', afterValue);
      }, 50);
      
      console.log('✅ 포뮬러 적용 완료:', {
        cellAddress,
        coordinates: `${row},${col}`,
        formula: formulaValue
      });
      
      // 포뮬러 적용 후 재계산 및 스토어 업데이트
      setTimeout(() => {
        const currentHot = hotRef.current?.hotInstance;
        if (currentHot && !currentHot.isDestroyed) {
          try {
            console.log('🔄 Handsontable 렌더링 시작...');
            currentHot.render();
            console.log('✅ Handsontable 렌더링 완료');
            
            // 스토어에 변경사항 반영
            if (xlsxData && activeSheetData) {
              const sheetIndex = xlsxData.activeSheetIndex;
              
              // 헤더 행을 고려하지 않고 바로 업데이트
              const dataRow = row;
              
              console.log('💾 스토어 업데이트:', {
                sheetIndex,
                dataRow,
                col,
                formula: formulaValue,
                originalRow: row
              });
              
              updateActiveSheetCell(dataRow, col, formulaValue);
              console.log('✅ 스토어 업데이트 완료');

            } else {
              console.log('⚠️ 스토어 업데이트 스킵 (데이터 없음)');
            }
            
            console.log('🎉 포뮬러 적용 및 스토어 업데이트 완료');
          } catch (error) {
            console.warn('포뮬러 적용 후 렌더링 중 오류 (무시됨):', error);
          }
        } else {
          console.warn('⚠️ Handsontable 인스턴스가 파괴됨');
        }
      }, 200);
      
    } catch (error) {
      console.error('❌ 포뮬러 적용 중 오류:', error);
      
      // 에러 발생 시 사용자에게 알림
      if (error instanceof Error) {
        console.error('에러 상세:', error.message);
        console.error('에러 스택:', error.stack);
        // 선택적으로 사용자에게 알림 표시
        alert(`포뮬러 적용 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  }, [xlsxData, activeSheetData, updateActiveSheetCell]);

  // 포뮬러 적용
  useEffect(() => {
    console.log('🔍 pendingFormula useEffect 트리거:', {
      hasPendingFormula: !!pendingFormula,
      hasHotInstance: !!hotRef.current?.hotInstance,
      pendingFormula: pendingFormula
    });

    if (pendingFormula && hotRef.current?.hotInstance) {
      console.log('✅ 포뮬러 적용 시작:', {
        formula: pendingFormula.formula,
        cellAddress: pendingFormula.cellAddress,
        sheetIndex: pendingFormula.sheetIndex,
        currentActiveSheetIndex: xlsxData?.activeSheetIndex
      });

      setInternalUpdate(true);

      // 다중 시트 포뮬러라면 해당 시트의 포뮬러인지 확인
      const targetSheetIndex = pendingFormula.sheetIndex ?? xlsxData?.activeSheetIndex ?? 0;

      console.log('🔍 시트 인덱스 확인:', {
        targetSheetIndex,
        currentActiveSheetIndex: xlsxData?.activeSheetIndex,
        shouldApply: targetSheetIndex === xlsxData?.activeSheetIndex
      });

      if (targetSheetIndex === xlsxData?.activeSheetIndex) {
        console.log('✅ 포뮬러 적용 중...');
        applyFormulaToCell(pendingFormula.formula, pendingFormula.cellAddress);

        // 포뮬러 적용 후 계산된 결과를 스토어에 반영
        setTimeout(() => {
          const hot = hotRef.current?.hotInstance;
          if (hot && !hot.isDestroyed && xlsxData) {
            try {
              const evaluatedData = hot.getData();
              console.log('🔄 포뮬러 적용 완료, 데이터 업데이트됨');
            } catch (error) {
              console.warn('포뮬러 적용 완료 처리 중 오류 (무시됨):', error);
            }
          }
          console.log('🧹 pendingFormula 정리 중...');
          setPendingFormula(null);
          setInternalUpdate(false);
        }, 200);
      } else {
        console.log('⚠️ 다른 시트의 포뮬러이므로 스킵');
        // 다른 시트의 포뮬러는 그 시트로 전환 후 적용
        setPendingFormula(null);
        setInternalUpdate(false);
      }
    } else {
      console.log('⚠️ 포뮬러 적용 조건 미충족:', {
        hasPendingFormula: !!pendingFormula,
        hasHotInstance: !!hotRef.current?.hotInstance
      });
    }
  }, [pendingFormula, setPendingFormula, setInternalUpdate, xlsxData, applyFormulaToCell]);

  // Named expression을 사용한 포뮬러 적용 시도
  const tryNamedExpressionApproach = (formula: string, cellAddress: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    try {
      console.log('Using named expression approach for formula:', formula);
      
      // 임시 해결책: 수식을 직접 셀에 적용
      const { row, col } = cellAddressToCoords(cellAddress);
      const formulaValue = formula.startsWith('=') ? formula : `=${formula}`;
      hot.setDataAtCell(row + 1, col, formulaValue);
      
      // 포뮬러 상태 초기화
      if (setPendingFormula) {
        setPendingFormula(null);
      }
      
      console.log('Named expression approach applied successfully');
    } catch (error) {
      console.error('Named expression approach failed:', error);
      
      // 최종 대안: 기본 셀 값 설정
      if (setPendingFormula) {
        setPendingFormula(null);
      }
    }
  };

  // 새 시트 생성 핸들러
  const handleCreateSheet = () => {
    if (!newSheetName.trim()) return;

    // 기본 빈 데이터로 새 시트 생성
    const emptyData = Array(20).fill(Array(6).fill(''));
    
    if (xlsxData) {
      // 기존 xlsxData가 있는 경우 새 시트 추가
      // 중복되는 시트명 확인
      const existingNames = xlsxData.sheets.map(s => s.sheetName);
      let uniqueName = newSheetName;
      let counter = 1;

      while (existingNames.includes(uniqueName)) {
        uniqueName = `${newSheetName} ${counter}`;
        counter++;
      }

      // 새 시트 데이터 생성
      const newSheet: SheetData = {
        sheetName: uniqueName,
        rawData: emptyData,
        metadata: {
          rowCount: emptyData.length,
          columnCount: emptyData[0]?.length || 0,
          dataRange: {
            startRow: 0,
            endRow: emptyData.length - 1,
            startCol: 0,
            endCol: (emptyData[0]?.length || 1) -1,
            startColLetter: 'A',
            endColLetter: String.fromCharCode(65 + (emptyData[0]?.length || 1) - 1)
          },
          lastModified: new Date()
        }
      };

      // 새 xlsxData 생성하여 적용
      const newXlsxData = { ...xlsxData };
      newXlsxData.sheets = [...newXlsxData.sheets, newSheet];
      const newSheetIndex = newXlsxData.sheets.length - 1;

      // 상태 업데이트
      setXLSXData(newXlsxData);

      // 새 시트로 전환
      setTimeout(() => {
        try {
          switchToSheet(newSheetIndex);
        } catch (error) {
          console.warn('시트 전환 중 오류 (무시됨):', error);
        }
      }, 100);
    } else {
      // xlsxData가 없는 경우 새로 생성
      const newXlsxData: XLSXData = {
        fileName: 'new_spreadsheet.xlsx',
        sheets: [
          {
            sheetName: newSheetName,
            rawData: emptyData,
            metadata: {
              rowCount: emptyData.length,
              columnCount: emptyData[0]?.length || 0,
              dataRange: {
                startRow: 0,
                endRow: emptyData.length - 1,
                startCol: 0,
                endCol: (emptyData[0]?.length || 1) -1,
                startColLetter: 'A',
                endColLetter: 'F'
              }
            }
          }
        ],
        activeSheetIndex: 0
      };

      setXLSXData(newXlsxData);
    }

    // 모달 상태 초기화
    setNewSheetName('');
    setIsCreateSheetModalOpen(false);
  };

  // 모달 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const modalElement = document.querySelector('.sheet-create-modal');
      const addButton = document.querySelector('.sheet-add-button');

      if (
        isCreateSheetModalOpen &&
        modalElement &&
        !modalElement.contains(target) &&
        addButton &&
        !addButton.contains(target)
      ) {
        setIsCreateSheetModalOpen(false);
        setNewSheetName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateSheetModalOpen]);

  // 스크롤바 관련 이벤트 핸들러
  useEffect(() => {
    const checkScroll = () => {
      const container = tabsContainerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth;

      // 스크롤바 표시 여부 설정
      setShowScrollbar(hasHorizontalScroll);

      // 스크롤바 thumb 위치와 너비 계산
      if (hasHorizontalScroll) {
        const thumbWidth = Math.max(30, (clientWidth / scrollWidth) * clientWidth);
        setScrollThumbWidth(thumbWidth);

        const maxScrollPosition = scrollWidth - clientWidth;
        const scrollPercentage = maxScrollPosition > 0 ? scrollLeft / maxScrollPosition : 0;
        const maxThumbPosition = clientWidth - thumbWidth;
        const thumbPosition = scrollPercentage * maxThumbPosition;

        setScrollThumbPosition(thumbPosition);
      }
    };

    // 초기 체크
    checkScroll();

    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [xlsxData?.sheets.length]);

  // 가상 스크롤바 클릭 핸들러
  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const scrollbarElement = e.currentTarget;
    const rect = scrollbarElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // 클릭한 위치로 thumb 이동
    const scrollPercentage = clickX / rect.width;
    const scrollPosition = scrollPercentage * (container.scrollWidth - container.clientWidth);

    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };

  // 드래그 시작 핸들러
  const handleThumbDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);

    const container = tabsContainerRef.current;
    if (container) {
      setDragStartScroll(container.scrollLeft);
    }

    // 글로벌 이벤트 리스너 추가
    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', handleThumbDragEnd);
  };

  // 드래그 중 핸들러
  const handleThumbDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const container = tabsContainerRef.current;
    if (!container) return;

    const deltaX = e.clientX - dragStartX;
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    const maxScrollPosition = scrollWidth - containerWidth;
    const dragRatio = containerWidth / scrollWidth;
    const scrollDelta = deltaX / dragRatio;

    container.scrollLeft = Math.max(0, Math.min(maxScrollPosition, dragStartScroll + scrollDelta));
  }, [isDragging, dragStartX, dragStartScroll]);

  // 드래그 종료 핸들러
  const handleThumbDragEnd = useCallback(() => {
    setIsDragging(false);

    // 글로벌 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', handleThumbDragEnd);
  }, [handleThumbDrag]);

  // 스크롤 이벤트 핸들러 등록 및 해제
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbDragEnd);
    };
  }, [handleThumbDrag, handleThumbDragEnd]);

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
        const allSheetIndices = xlsxData.sheets.map((_, index) => index);
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
          sheets: xlsxData.sheets.map(sheet => ({
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

  // afterChange 핸들러 수정 - 원본 구조 고려
  const handleAfterChange = useCallback((
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    // 내부 업데이트이거나 로드 시점, 또는 변경사항이 없으면 스킵
    if (isInternalUpdate || source === 'loadData' || !changes) {
      return;
    }

    if (xlsxData && activeSheetData) {
        // 변경된 셀마다 스토어 업데이트 액션 호출
        changes.forEach(([row, col, oldValue, newValue]) => {
            if (typeof row === 'number' && typeof col === 'number') {
                updateActiveSheetCell(row, col, newValue?.toString() || '');
            }
        });
    }
  }, [isInternalUpdate, xlsxData, activeSheetData, updateActiveSheetCell]);

  const handleCellSelection = useCallback((row: number, col: number, row2?: number, col2?: number) => {
    if (!hotRef.current?.hotInstance) return;

    const hot = hotRef.current.hotInstance;
    
    let value = '';
    let formula = '';
    const actualDataRow = row; // 헤더 개념이 없으므로 row가 실제 데이터 행
    let sheetName = '시트'; // 기본 시트명

    try {
        // 셀 값 가져오기
        value = hot.getDataAtCell(row, col) || '';
        
        // 시트가 있는 경우
        if (xlsxData && activeSheetData) {
            sheetName = activeSheetData.sheetName;
            
            // rawData에서 직접 값 가져오기
            if (activeSheetData.rawData && activeSheetData.rawData.length > 0) {
                value = activeSheetData.rawData[row]?.[col] || '';
            }
            
            // 수식 확인
            const formulasPlugin = hot.getPlugin('formulas');
            if (formulasPlugin && formulasPlugin.engine) {
                const cellCoord = { row, col, sheet: 0 };
                const cellFormula = formulasPlugin.engine.getCellFormula(cellCoord);
                
                if (cellFormula && cellFormula.startsWith('=')) {
                    formula = cellFormula;
                }
            }
        } else {
            // 시트가 없는 경우 기본 처리
        }

        // 셀 주소 계산 - 엑셀 형식 (A1, B2 등)
        const colLetter = String.fromCharCode(65 + col);
        const cellAddress = `${colLetter}${row + 1}`;

        // 시트 참조 포함된 주소 - 간단한 셀 주소 생성
        const fullReference = `${sheetName}!${cellAddress}`;

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
        
        // 디버그 정보
        console.log('Selected cell:', {
            address: cellAddress,
            fullReference,
            value: value || '(empty)',
            formula: formula || 'none',
            actualDataRow,
            originalRow: row,
            originalCol: col,
            sheetName,
            hasXlsxData: !!xlsxData,
            hasActiveSheetData: !!activeSheetData
        });
    } catch (error) {
        console.error('Error getting cell info:', error);
    }
}, [xlsxData, activeSheetData]);

  const hotSettings = useMemo(() => getHotTableSettings({
    activeSheetData,
    formulasConfig,
    isInternalUpdate,
    handleAfterChange,
    handleCellSelection,
    hotRef
  }), [activeSheetData, formulasConfig, isInternalUpdate, handleAfterChange, handleCellSelection, hotRef]);

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
        sheets: xlsxData.sheets.map(sheet => ({
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
      const allSheetIndices = xlsxData.sheets.map((_, index) => index);
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

  // 셀 편집 관련 핸들러 추가
  const handleCellEditChange = useCallback((value: string) => {
    setCellEditValue(value);
  }, []);

  const handleCellEditSubmit = useCallback(() => {
    if (!selectedCellInfo || !hotRef.current?.hotInstance) return;

    const hot = hotRef.current.hotInstance;
    
    try {
      // 셀 값 업데이트
      const actualRow = selectedCellInfo.row >= 0 ? selectedCellInfo.row + 1 : 0; // 헤더 고려
      hot.setDataAtCell(actualRow, selectedCellInfo.col, cellEditValue);
      
      // 편집 모드 종료
      setIsCellEditing(false);
      
      // 강제 재렌더링
      setTimeout(() => {
        hot.render();
      }, 100);
    } catch (error) {
      console.error('Error updating cell:', error);
    }
  }, [selectedCellInfo, cellEditValue]);

  const handleCellEditCancel = useCallback(() => {
    // 원래 값으로 복원
    if (selectedCellInfo) {
      setCellEditValue(selectedCellInfo.formula || selectedCellInfo.value?.toString() || '');
    }
    setIsCellEditing(false);
  }, [selectedCellInfo]);

  const handleCellEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellEditSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellEditCancel();
    }
  }, [handleCellEditSubmit, handleCellEditCancel]);

  // 셀 선택이 변경될 때 편집 값 업데이트
  useEffect(() => {
    if (selectedCellInfo) {
      setCellEditValue(selectedCellInfo.formula || selectedCellInfo.value?.toString() || '');
      setIsCellEditing(false);
    }
  }, [selectedCellInfo]);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 저장 상태를 표시하는 UI 렌더링 함수
  const renderSaveStatus = () => {
    if (!currentSpreadsheetId) return null; // 파일이 없을 때는 표시 안함

    let icon = null;
    let iconColor = 'text-gray-500';

    switch (saveStatus) {
        case 'modified':
            icon = <AlertCircle className="h-4 w-4" />;
            iconColor = 'text-yellow-600';
            break;
        case 'saving':
            icon = <Loader2 className="h-4 w-4 animate-spin" />;
            iconColor = 'text-blue-600';
            break;
        case 'synced':
            icon = <CheckCircle className="h-4 w-4" />;
            iconColor = 'text-green-600';
            break;
        case 'error':
            icon = <XCircle className="h-4 w-4" />;
            iconColor = 'text-red-600';
            break;
    }

    if (!icon) return null;

    return (
        <div className="flex items-center mr-4">
            <div className={iconColor}>{icon}</div>
        </div>
    );
  };

  // 개발 환경에서 상태 디버깅
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MainSpreadSheet 컴포넌트 상태:', {
        hasXlsxData: !!xlsxData,
        fileName: xlsxData?.fileName || 'No file',
        sheetsCount: xlsxData?.sheets?.length || 0,
        activeSheetIndex: xlsxData?.activeSheetIndex ?? 0,
        activeSheetName: xlsxData?.sheets?.[xlsxData?.activeSheetIndex || 0]?.sheetName || '시트 (default)',
        currentSpreadsheetId: currentSpreadsheetId || 'None',
        hasActiveSheetData: !!activeSheetData,
        displayDataLength: displayData.length,
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
      if (activeSheetData?.rawData) {
        console.log('✅ 렌더링 후 activeSheetData.rawData:', activeSheetData.rawData);
      }
    }
  }, [xlsxData, activeSheetData, displayData, currentSpreadsheetId]);

  // 시트 변경 시에만 Handsontable 데이터 업데이트
  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (hot && xlsxData && activeSheetData) {
      console.log('🔄 시트 변경 감지 - 데이터 업데이트:', {
        activeSheetIndex: xlsxData.activeSheetIndex,
        activeSheetName: activeSheetData.sheetName,
        lastModified: activeSheetData.metadata?.lastModified,
      });

      // 새 시트 데이터 생성. rawData를 직접 사용.
      let newSheetData: any[][] = [];

      if (activeSheetData.rawData && activeSheetData.rawData.length > 0) {
        newSheetData = [...activeSheetData.rawData];
      }

      // 엑셀처럼 추가 빈 행과 열 제공
      const currentRows = newSheetData.length;
      const currentCols = Math.max(...newSheetData.map(row => row?.length || 0));
      
      const targetRows = Math.max(100, currentRows + 50);
      const targetCols = Math.max(26, currentCols + 10);

      // 데이터 확장
      const expandedData = newSheetData.map(row => {
        const expandedRow = [...(row || [])];
        while (expandedRow.length < targetCols) {
          expandedRow.push('');
        }
        return expandedRow;
      });

      while (expandedData.length < targetRows) {
        expandedData.push(Array(targetCols).fill(''));
      }

      // Handsontable에 새 데이터 로드 (시트 변경 시에만)
      hot.loadData(expandedData);
      
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
  }, [xlsxData?.activeSheetIndex, activeSheetData?.sheetName, activeSheetData?.metadata?.lastModified]); // 리렌더링 시 데이터 덮어쓰기 방지

  // 내보내기 버튼 UI를 상단 컨트롤 패널에 추가
  const renderExportControls = useCallback(() => {
    return (
      <div className="relative" style={{ zIndex: 9999 }}>
        <button
          className="export-button flex items-center space-x-1.5 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm transition-colors duration-200"
          onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
          type="button"
          style={{
            borderColor: '#005DE9',
            color: '#005DE9'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <FileDown size={16} />
          <span>내보내기</span>
        </button>

        {/* 내보내기 드롭다운 - 포털로 렌더링 */}
        {isExportDropdownOpen && (
          <div className="export-dropdown absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50 min-w-[180px]" style={{ zIndex: 9999 }}>
            <div className="py-1">
              <button
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2 text-sm"
                onClick={handleExportToCSV}
                disabled={!activeSheetData}
                type="button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>CSV로 내보내기</span>
                <span className="text-xs text-gray-500">(현재 시트)</span>
              </button>
              <button
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2 text-sm"
                onClick={handleExportToXLSX}
                disabled={!xlsxData}
                type="button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>XLSX로 내보내기</span>
                <span className="text-xs text-gray-500">(모든/선택 시트)</span>
              </button>
            </div>
          </div>
        )}

        {/* XLSX 시트 선택기 */}
        {isXlsxSelectorOpen && xlsxData && (
          <div className="xlsx-sheet-selector absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 min-w-[300px]" style={{ zIndex: 9999 }}>
            <div className="p-4">
              <h3 className="font-medium text-gray-800 mb-3">내보낼 시트 선택</h3>

              {/* 파일명 입력 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">파일명</label>
                <input
                  type="text"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  placeholder="파일명 입력 (확장자 제외)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{
                    '--tw-ring-color': '#005DE9'
                  } as React.CSSProperties}
                  onFocusCapture={(e) => {
                    e.target.style.borderColor = '#005DE9';
                    e.target.style.boxShadow = '0 0 0 2px rgba(0, 93, 233, 0.2)';
                  }}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* 시트 선택 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-600">시트</label>
                  <button
                    className="text-xs hover:underline transition-colors duration-200"
                    onClick={toggleAllSheets}
                    type="button"
                    style={{ color: '#005DE9' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#004ab8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#005DE9';
                    }}
                  >
                    {selectedSheets.length === xlsxData.sheets.length ? '모두 해제' : '모두 선택'}
                  </button>
                </div>

                <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-md divide-y">
                  {xlsxData.sheets.map((sheet, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2.5 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={`sheet-${index}`}
                        checked={selectedSheets.includes(index)}
                        onChange={() => toggleSheetSelection(index)}
                        className="mr-2.5"
                        style={{
                          accentColor: '#005DE9'
                        }}
                      />
                      <label
                        htmlFor={`sheet-${index}`}
                        className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                      >
                        <span>{sheet.sheetName}</span>
                        <span className="text-xs text-gray-500">
                          {sheet.rawData?.[0]?.length || 0}×{sheet.rawData?.length || 0}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setIsXlsxSelectorOpen(false);
                    setSelectedSheets([]);
                    setExportFileName('');
                  }}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="px-3 py-1.5 text-white rounded-md text-sm transition-colors"
                  onClick={executeXlsxExport}
                  disabled={selectedSheets.length === 0}
                  type="button"
                  style={{
                    backgroundColor: '#005DE9'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#004ab8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#005DE9';
                    }
                  }}
                >
                  내보내기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [isExportDropdownOpen, isXlsxSelectorOpen, xlsxData, selectedSheets, exportFileName, handleExportToCSV, handleExportToXLSX, executeXlsxExport, toggleAllSheets]);

  // 셀 클릭 시 포뮬러 적용 버튼 표시
  const handleCellClick = useCallback((row: number, col: number) => {
    if (pendingFormula) {
      console.log('Pending formula detected, showing application prompt');
      
      // 포뮬러가 있는 경우 확인 창 표시
      const colLetter = String.fromCharCode(65 + col);
      const cellAddress = `${colLetter}${row + 1}`;
      const shouldApply = window.confirm(
        `포뮬러 "${pendingFormula.formula}"를 셀 ${cellAddress}에 적용하시겠습니까?`
      );

      if (shouldApply) {
        applyFormulaToCell(pendingFormula.formula, cellAddress);
        setPendingFormula(null);
      }
    } else {
      // 포뮬러가 없는 경우 셀 선택 상태 업데이트
      setSelectedCell({ row, col });
    }
  }, [pendingFormula, setPendingFormula, applyFormulaToCell]);

  // 빈 시트 상태에서 기본 컨텍스트 생성 및 데이터 변경 감지
  useEffect(() => {
    // 시트가 없고 채팅이 가능한 상태에서 기본 시트 컨텍스트 설정
    if (!xlsxData && !activeSheetData && !loadingStates.fileUpload) {
      console.log('🔧 빈 시트 상태에서 기본 컨텍스트 초기화');
      
      // 현재 사용자가 채팅을 시작할 수 있도록 빈 시트 환경 준비
      // 실제 XLSX 데이터가 없어도 채팅은 가능하도록 설정
      console.log('빈 스프레드시트 환경 준비 완료');
    }
  }, [xlsxData, activeSheetData, loadingStates.fileUpload]);

  // 스프레드시트 데이터 변경 시 선택된 셀 정보 초기화
  useEffect(() => {
    console.log('📋 스프레드시트 데이터 변경 감지 - 선택된 셀 정보 초기화');
    setSelectedCellInfo(null);
    setCellEditValue('');
    setIsCellEditing(false);
  }, [xlsxData, activeSheetData]);

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
        <div className="example-controls-container bg-[#F9F9F7] border-b border-gray-200 p-2 shadow-sm flex-shrink-0 " style={{ position: 'relative', zIndex: 9000 }}>
          <div className="flex items-center justify-between space-x-2">
            {/* 사이드바 토글 버튼과 로고 */}
            <div className="flex items-center space-x-2">
              {/* 햄버거 버튼 주석처리 */}
              
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200"
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
             
              
              {/* EXTION 텍스트 로고 */}
              <h1 className="text-xl font-bold text-gray-800" style={{ color: '#005DE9' }}>
                EXTION
              </h1>
            </div>

            {/* 선택된 셀 정보 표시 */}
            {selectedCellInfo && (
              <div className="flex items-center space-x-4 text-sm text-gray-700 flex-1 mr-4 min-w-0">
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                    {selectedCellInfo.cellAddress}
                  </span>
                </div>
                
                {/* 편집 가능한 셀 값 입력 필드 */}
                <div className="flex items-center space-x-2 flex-1 max-w-md min-w-0">
                  <span className="font-medium flex-shrink-0">Fx:</span>
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={cellEditValue}
                      onChange={(e) => handleCellEditChange(e.target.value)}
                      onFocus={() => setIsCellEditing(true)}
                      onBlur={() => {
                        // 블러 이벤트에서는 약간의 지연을 둬서 버튼 클릭이 처리될 수 있도록 함
                        setTimeout(() => {
                          if (!isCellEditing) return;
                          handleCellEditSubmit();
                        }, 150);
                      }}
                      onKeyDown={handleCellEditKeyDown}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{
                        '--tw-ring-color': '#005DE9'
                      } as React.CSSProperties}
                      onFocusCapture={(e) => {
                        e.target.style.borderColor = '#005DE9';
                        e.target.style.boxShadow = '0 0 0 2px rgba(0, 93, 233, 0.2)';
                      }}
                      onBlurCapture={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="값 또는 수식 입력 (예: =SUM(A1:A5))"
                    />
                    
                    {/* 편집 모드일 때 확인/취소 버튼 표시 */}
                    {isCellEditing && (
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
                        <button
                          type="button"
                          onClick={handleCellEditSubmit}
                          className="w-6 h-6 text-white rounded text-xs flex items-center justify-center transition-colors duration-200"
                          style={{ backgroundColor: '#005DE9' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#004ab8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#005DE9';
                          }}
                          title="확인 (Enter)"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCellEditCancel}
                          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-xs flex items-center justify-center transition-colors duration-200"
                          title="취소 (Escape)"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 오른쪽 버튼 그룹 */}
            <div className="flex items-center ml-auto space-x-2">
              {renderSaveStatus()}
              {/* 개발자와 소통하기 버튼 */}
              <a
                href="https://open.kakao.com/o/gB4EkaAh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm transition-colors duration-200"
                style={{
                  borderColor: '#005DE9',
                  color: '#005DE9'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <MessageCircleIcon size={16} />
                <span>개발자와 소통하기</span>
              </a>
              {/* 내보내기 버튼 추가 */}
              {renderExportControls()}
            </div>
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#004ab8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#005DE9';
                  }}
                  type="button"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 시트 탭 바 - z-index 추가 */}
        <div className="relative flex-shrink-0" style={{ zIndex: 8000 }}>
          <div className="flex flex-col bg-[#F9F9F7]">
            <div className="flex items-center border-gray-200">
              {/* 시트 탭 컨테이너 - 시트 있을 때와 없을 때 모두 표시 */}
              <div ref={tabsContainerRef} className="sheet-tabs-container">
                {xlsxData && xlsxData.sheets.length > 0 ? (
                  /* 시트가 있는 경우 시트 탭 표시 */
                  xlsxData.sheets.map((sheet, index) => (
                    <div
                      key={index}
                      onClick={() => handleSheetChange(index)}
                      className={`sheet-tab ${index === xlsxData.activeSheetIndex ? 'active' : ''}`}
                    >
                      <span>{sheet.sheetName}</span>
                      <span className="sheet-info">
                        {sheet.rawData?.[0]?.length || 0}×{sheet.rawData?.length || 0}
                      </span>
                    </div>
                  ))
                ) : (
                  /* 시트가 없는 경우 기본 시트 탭 표시 */
                  <div className="sheet-tab active">
                    <span>시트</span>
                    <span className="sheet-info">
                      26×100
                    </span>
                  </div>
                )}
              </div>

              {/* 시트 추가 버튼 - 항상 같은 위치에 표시 */}
              {/* <div className="relative">
                <button
                  className="sheet-add-button"
                  onClick={() => setIsCreateSheetModalOpen(true)}
                  aria-label="새 시트 추가"
                >
                  <Plus size={18} />
                </button>

                {isCreateSheetModalOpen && (
                  <div className="sheet-create-modal">
                    <h3 className="text-base font-medium mb-3">새 시트 만들기</h3>
                    <input
                      type="text"
                      placeholder="시트 이름"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      autoFocus
                    />
                    <div className="sheet-create-modal-buttons">
                      <button
                        className="cancel-button"
                        onClick={() => {
                          setIsCreateSheetModalOpen(false);
                          setNewSheetName('');
                        }}
                      >
                        취소
                      </button>
                      <button
                        className="create-button"
                        onClick={handleCreateSheet}
                        disabled={!newSheetName.trim()}
                      >
                        만들기
                      </button>
                    </div>
                  </div>
                )}
              </div> */}
            </div>

            {/* 간단한 브라우저 스타일 스크롤바 */}
            {showScrollbar && (
              <div
                className="tab-scrollbar-container"
                onClick={handleScrollbarClick}
              >
                <div
                  className={`tab-scrollbar-thumb ${isDragging ? 'dragging' : ''}`}
                  style={{
                    width: `${scrollThumbWidth}px`,
                    left: `${scrollThumbPosition}px`
                  }}
                  onMouseDown={handleThumbDragStart}
                />
              </div>
            )}
          </div>

          {/* 로딩 상태 표시 */}
          {loadingStates.sheetSwitch && (
            <div className="absolute top-full left-0 right-0 mt-1 flex items-center justify-center py-2 bg-white shadow-sm z-10">
              <div className="w-4 h-4 border-2 border-[#005DE9] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-xs text-gray-600">시트 전환 중...</span>
            </div>
          )}
        </div>

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