'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { HotTableRef } from '@handsontable/react-wrapper';
import { useUnifiedStore } from '@/stores';
import { cellAddressToCoords } from '@/stores/store-utils/xlsxUtils';
import { SelectedCellInfo } from '@/types/spreadsheet';

export const useSpreadsheetLogic = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [selectedCellInfo, setSelectedCellInfo] = useState<SelectedCellInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const {
    xlsxData,
    activeSheetData,
    loadingStates,
    updateActiveSheetCell,
    pendingFormula,
    setPendingFormula,
    setInternalUpdate,
    isInternalUpdate,
  } = useUnifiedStore();

  // 시트 전환 핸들러
  const handleSheetChange = useCallback(async (sheetIndex: number) => {
    console.log('=== 시트 전환 시작 ===');
    console.log('전환 정보:', {
      fromIndex: xlsxData?.activeSheetIndex,
      toIndex: sheetIndex,
      totalSheets: xlsxData?.sheets.length,
      targetSheetName: xlsxData?.sheets[sheetIndex]?.sheetName
    });

    const { switchToSheet, setLoadingState } = useUnifiedStore.getState();
    
    setLoadingState('sheetSwitch', true);
    try {
      await switchToSheet(sheetIndex);

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
  }, [xlsxData]);

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
              const dataRow = row;

              console.log('💾 스토어 업데이트:', {
                sheetIndex: xlsxData.activeSheetIndex,
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
        alert(`포뮬러 적용 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  }, [xlsxData, activeSheetData, updateActiveSheetCell]);

  // afterChange 핸들러
  const handleAfterChange = useCallback((
    changes: any[] | null,
    source: string
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

  // 셀 선택 핸들러
  const handleCellSelection = useCallback((row: number, col: number, row2?: number, col2?: number) => {
    if (!hotRef.current?.hotInstance) return;

    const hot = hotRef.current.hotInstance;

    let value = '';
    let formula = '';
    const actualDataRow = row;
    let sheetName = '시트';

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
      }

      // 셀 주소 계산 - 엑셀 형식 (A1, B2 등)
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

      // 디버그 정보
      console.log('Selected cell:', {
        address: cellAddress,
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

  // 셀 클릭 핸들러
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

  // 포뮬러 적용 useEffect
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

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return {
    hotRef,
    selectedCellInfo,
    setSelectedCellInfo,
    isSidebarOpen,
    selectedCell,
    handleSheetChange,
    applyFormulaToCell,
    handleAfterChange,
    handleCellSelection,
    handleCellClick,
    toggleSidebar,
  };
}; 