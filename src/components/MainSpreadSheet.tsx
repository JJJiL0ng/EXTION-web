//Src/components/MainSpreadSheet.tsx
'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { ChevronDown, Layers } from 'lucide-react';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import { cellAddressToCoords } from '@/stores/useUnifiedDataStore';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

// Handsontable z-index 문제 해결을 위한 스타일
import { createGlobalStyle } from 'styled-components';

const HandsontableStyles = createGlobalStyle`
  /* 모달이 열렸을 때 Handsontable의 z-index 조정 */
  .modal-open .handsontable {
    z-index: 0 !important;
  }
  
  .modal-open .ht_master {
    z-index: 0 !important;
  }
  
  .modal-open .ht_clone_top,
  .modal-open .ht_clone_left,
  .modal-open .ht_clone_top_left_corner,
  .modal-open .ht_clone_bottom,
  .modal-open .ht_clone_bottom_left_corner,
  .modal-open .ht_clone_right {
    z-index: 0 !important;
  }

  /* 시트 선택 드롭다운 스타일 */
  .sheet-selector {
    z-index: 1000;
  }

  .sheet-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
  }

  .sheet-dropdown-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
  }

  .sheet-dropdown-item:hover {
    background-color: #f9fafb;
  }

  .sheet-dropdown-item.active {
    background-color: #eff6ff;
    color: #1d4ed8;
  }
`;

registerAllModules();

// 공유 HyperFormula 인스턴스 생성
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
  maxRows: 10000,
  maxColumns: 1000,
});

// CSV 데이터가 없을 때의 기본 설정
const defaultData = [
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
];

// 선택된 셀 정보 인터페이스
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
  
  // Zustand 스토어 사용 - 확장된 스토어로 변경
  const {
    xlsxData,
    activeSheetData,
    extendedSheetContext,
    loadingStates,
    isInternalUpdate,
    pendingFormula,
    computedSheetData,
    updateActiveSheetCell,
    setComputedDataForSheet,
    setInternalUpdate,
    setPendingFormula,
    getCurrentSheetData,
    switchToSheet,
    coordsToSheetReference,
    setLoadingState
  } = useExtendedUnifiedDataStore();

  const [isAutosave] = useState<boolean>(false);

  // HyperFormula 설정
  const [formulasConfig] = useState<DetailedSettings>({
    engine: hyperformulaInstance,
    namedExpressions: [],
    sheetName: extendedSheetContext?.sheetName || 'Sheet1',
  });

  // 표시할 데이터 준비 - 활성 시트 데이터 사용
  const displayData = useMemo(() => {
    if (!activeSheetData) return defaultData;
    
    const currentData = getCurrentSheetData();
    const data = [activeSheetData.headers, ...(currentData || activeSheetData.data)];
    return data;
  }, [activeSheetData, getCurrentSheetData]);

  // 시트 전환 핸들러
  const handleSheetChange = useCallback(async (sheetIndex: number) => {
    setLoadingState('sheetSwitch', true);
    try {
      await switchToSheet(sheetIndex);
      setIsSheetDropdownOpen(false);
      
      // 시트 전환 시 선택된 셀 정보 초기화
      setSelectedCellInfo(null);
      
      // Handsontable 인스턴스 재렌더링
      setTimeout(() => {
        hotRef.current?.hotInstance?.render();
      }, 100);
    } catch (error) {
      console.error('Sheet switch error:', error);
    } finally {
      setLoadingState('sheetSwitch', false);
    }
  }, [switchToSheet, setLoadingState]);

  // 셀 선택 핸들러
  const handleCellSelection = useCallback((row: number, col: number) => {
    if (!hotRef.current?.hotInstance || !xlsxData || !activeSheetData) return;

    const hot = hotRef.current.hotInstance;
    
    // 헤더 행 제외한 실제 데이터 행
    const dataRow = row - 1;
    let value = '';
    let formula = '';

    try {
      // 셀 값 가져오기
      value = hot.getDataAtCell(row, col) || '';
      
      // 수식 확인 (수식이 있는 경우)
      const formulasPlugin = hot.getPlugin('formulas');
      if (formulasPlugin && formulasPlugin.engine) {
        const cellCoord = { row, col, sheet: 0 };
        const cellValue = formulasPlugin.engine.getCellValue(cellCoord);
        const cellFormula = formulasPlugin.engine.getCellFormula(cellCoord);
        
        if (cellFormula && cellFormula.startsWith('=')) {
          formula = cellFormula;
        }
      }

      // 셀 주소 계산 (A1, B2 등)
      const colLetter = String.fromCharCode(65 + col);
      const cellAddress = `${colLetter}${row + 1}`;

      // 시트 참조 포함된 주소
      const fullReference = coordsToSheetReference(
        xlsxData.activeSheetIndex,
        dataRow >= 0 ? dataRow : 0,
        col
      );

      const cellInfo: SelectedCellInfo = {
        row: dataRow >= 0 ? dataRow : row,
        col,
        cellAddress,
        value,
        formula: formula || undefined,
        sheetIndex: xlsxData.activeSheetIndex,
        timestamp: new Date()
      };

      setSelectedCellInfo(cellInfo);
      
      console.log('Selected cell:', {
        address: cellAddress,
        fullReference,
        value,
        formula: formula || 'none',
        sheetName: activeSheetData.sheetName
      });
    } catch (error) {
      console.error('Error getting cell info:', error);
    }
  }, [xlsxData, activeSheetData, coordsToSheetReference]);

  // 포뮬러 적용
  useEffect(() => {
    if (pendingFormula && hotRef.current?.hotInstance) {
      setInternalUpdate(true);
      
      // 다중 시트 포뮬러라면 해당 시트의 포뮬러인지 확인
      const targetSheetIndex = pendingFormula.sheetIndex ?? xlsxData?.activeSheetIndex ?? 0;
      
      if (targetSheetIndex === xlsxData?.activeSheetIndex) {
        applyFormulaToCell(pendingFormula.formula, pendingFormula.cellAddress);
        
        // 포뮬러 적용 후 계산된 결과를 스토어에 반영
        setTimeout(() => {
          const hot = hotRef.current?.hotInstance;
          if (hot && xlsxData) {
            const evaluatedData = hot.getData();
            // 헤더 행 제외하고 데이터만 저장
            setComputedDataForSheet(xlsxData.activeSheetIndex, evaluatedData.slice(1));
          }
          setPendingFormula(null);
          setInternalUpdate(false);
        }, 200);
      } else {
        // 다른 시트의 포뮬러는 그 시트로 전환 후 적용
        setPendingFormula(null);
        setInternalUpdate(false);
      }
    }
  }, [pendingFormula, setPendingFormula, setInternalUpdate, setComputedDataForSheet, xlsxData]);

  // 셀에 함수를 적용하는 함수
  const applyFormulaToCell = (formula: string, cellAddress: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) {
      console.error('Handsontable instance not available');
      return;
    }

    try {
      // 셀 주소를 좌표로 변환
      const { row, col } = cellAddressToCoords(cellAddress);
      
      console.log(`Applying formula "${formula}" to cell ${cellAddress} (${row}, ${col})`);
      
      // 수식이 = 로 시작하는지 확인하고, 그렇지 않으면 자동으로 추가
      const formulaValue = formula.startsWith('=') ? formula : `=${formula}`;
      
      // 직접 셀에 함수 설정 (헤더 행 때문에 row + 1)
      hot.setDataAtCell(row + 1, col, formulaValue);
      
      // 강제 재렌더링 및 계산
      setTimeout(() => {
        hot.render();
        console.log('Formula applied successfully');
      }, 100);
    } catch (error) {
      console.error('Error applying formula:', error);
      
      // 오류 발생 시 대안으로 네임드 익스프레션 사용 시도
      tryNamedExpressionApproach(formula, cellAddress);
    }
  };

  // 네임드 익스프레션을 사용한 대안 접근법
  const tryNamedExpressionApproach = (formula: string, cellAddress: string) => {
    const hot = hotRef.current?.hotInstance;
    const formulasPlugin = hot?.getPlugin('formulas');
    
    if (!formulasPlugin?.engine) {
      console.error('Formulas engine not available');
      return;
    }

    try {
      // 고유한 네임드 익스프레션 이름 생성
      const namedExpName = `FORMULA_${Date.now()}`;
      
      // 네임드 익스프레션 추가
      formulasPlugin.engine.addNamedExpression(namedExpName, formula);
      
      // 셀에 네임드 익스프레션 참조 설정 (헤더 행 때문에 row + 1)
      const { row, col } = cellAddressToCoords(cellAddress);
      hot?.setDataAtCell(row + 1, col, `=${namedExpName}`);
      
      // 재렌더링
      hot?.render();
      
      console.log(`Applied formula using named expression: ${namedExpName}`);
    } catch (error) {
      console.error('Named expression approach also failed:', error);
    }
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
    <div className="h-full flex flex-col">
      {/* Handsontable z-index 문제 해결을 위한 스타일 */}
      <HandsontableStyles />
      
      {/* 상단 컨트롤 패널 */}
      <div className="example-controls-container bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* 시트 선택 드롭다운 */}
          {xlsxData && xlsxData.sheets.length > 1 && (
            <div className="relative sheet-selector">
              <button
                onClick={() => setIsSheetDropdownOpen(!isSheetDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingStates.sheetSwitch}
              >
                <Layers className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {xlsxData.sheets[xlsxData.activeSheetIndex]?.sheetName || 'Sheet1'}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isSheetDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {isSheetDropdownOpen && (
                <div className="sheet-dropdown">
                  {xlsxData.sheets.map((sheet, index) => (
                    <div
                      key={index}
                      onClick={() => handleSheetChange(index)}
                      className={`sheet-dropdown-item ${
                        index === xlsxData.activeSheetIndex ? 'active' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{sheet.sheetName}</span>
                        <span className="text-xs text-gray-500">
                          {sheet.headers.length}열 × {sheet.data.length}행
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {loadingStates.sheetSwitch && (
                <div className="absolute top-full left-0 right-0 mt-1 flex items-center justify-center py-2 bg-white border border-gray-200 rounded-lg shadow">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs text-gray-600">전환 중...</span>
                </div>
              )}
            </div>
          )}

          {/* 선택된 셀 정보 표시 */}
          {selectedCellInfo && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="font-medium">셀:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {selectedCellInfo.cellAddress}
                </span>
              </div>
              {selectedCellInfo.formula && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">수식:</span>
                  <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700">
                    {selectedCellInfo.formula}
                  </span>
                </div>
              )}
              {!selectedCellInfo.formula && selectedCellInfo.value && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">값:</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {selectedCellInfo.value.toString().length > 30 
                      ? `${selectedCellInfo.value.toString().substring(0, 30)}...`
                      : selectedCellInfo.value.toString()
                    }
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 포뮬러 적용 대기 알림 */}
        {pendingFormula && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  포뮬러 적용 대기 중
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {pendingFormula.cellAddress}에 {pendingFormula.formula} 적용
                  {pendingFormula.sheetIndex !== undefined && 
                    ` (시트 ${xlsxData?.sheets[pendingFormula.sheetIndex]?.sheetName || pendingFormula.sheetIndex})`
                  }
                </p>
              </div>
              <button
                onClick={() => setPendingFormula(null)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 스프레드시트 영역 */}
      <div className="flex-1 overflow-auto">
        <HotTable
          ref={hotRef}
          rowHeaders={true}
          colHeaders={true}
          height="100%"
          autoWrapRow={true}
          autoWrapCol={true}
          minRows={8}
          minCols={activeSheetData?.headers.length || 6}
          minSpareCols={5}
          minSpareRows={3}
          manualColumnResize={true}
          manualRowResize={true}
          persistentState={true}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          wordWrap={true}
          readOnly={false}
          columnSorting={false}
          filters={true}
          contextMenu={true}
          dropdownMenu={true}
          data={displayData}
          formulas={formulasConfig}
          language="ko-Kr"
          afterChange={(
            changes: Handsontable.CellChange[] | null,
            source: Handsontable.ChangeSource
          ) => {
            // 내부 업데이트이거나 로드 시점이면 스킵
            if (isInternalUpdate || source === 'loadData') {
              return;
            }

            // 사용자 변경사항을 스토어에 반영
            if (changes && activeSheetData) {
              changes.forEach(([row, col, , newValue]) => {
                if (typeof row === 'number' && typeof col === 'number') {
                  // 헤더 행 제외 (헤더가 첫 번째 행에 있으므로)
                  const dataRow = row - 1;
                  if (dataRow >= 0) {
                    updateActiveSheetCell(dataRow, col, newValue?.toString() || '');
                  }
                }
              });
            }

            if (!isAutosave) {
              return;
            }
          }}
          // 셀 선택 이벤트 처리
          afterSelection={(row, col) => {
            handleCellSelection(row, col);
          }}
          afterSelectionEnd={(row, col) => {
            handleCellSelection(row, col);
          }}
          // 셀 값 변경 후 포뮬러 업데이트 훅
          afterSetDataAtCell={() => {
            console.log('Data set, recalculating formulas...');
            
            // 100ms 후에 재렌더링 (포뮬러가 계산될 시간을 줌)
            setTimeout(() => {
              hotRef.current?.hotInstance?.render();
            }, 100);
          }}
        />
      </div>
    </div>
  );
};

export default MainSpreadSheet;