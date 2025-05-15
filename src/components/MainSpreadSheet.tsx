// components/MainSpreadSheet.tsx
'use client'

import { useState, useRef, useEffect, useMemo } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { useUnifiedDataStore } from '../stores/useUnifiedDataStore';
import { cellAddressToCoords } from '../stores/useSpreadsheetStore';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

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

const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  
  // Zustand 스토어 사용
  const {
    rawCsvData,
    computedData,
    sheetContext,
    loadingStates,
    isInternalUpdate,
    pendingFormula,
    updateCellData,
    setComputedData,
    setInternalUpdate,
    setPendingFormula,
    getCurrentData
  } = useUnifiedDataStore();

  const [isAutosave] = useState<boolean>(false);

  // HyperFormula 설정
  const [formulasConfig] = useState<DetailedSettings>({
    engine: hyperformulaInstance,
    namedExpressions: [],
    sheetName: sheetContext?.sheetName || 'Sheet1', // 시트 이름 지정
  });

  // 표시할 데이터 준비
  const displayData = useMemo(() => {
    const data = rawCsvData 
      ? [rawCsvData.headers, ...(getCurrentData() || rawCsvData.data)]
      : defaultData;
    return data;
  }, [rawCsvData, computedData, getCurrentData]);

  // 포뮬러 적용
  useEffect(() => {
    if (pendingFormula && hotRef.current?.hotInstance) {
      setInternalUpdate(true);
      applyFormulaToCell(pendingFormula.formula, pendingFormula.cellAddress);
      
      // 포뮬러 적용 후 계산된 결과를 스토어에 반영
      setTimeout(() => {
        const hot = hotRef.current?.hotInstance;
        if (hot) {
          const evaluatedData = hot.getData();
          // 헤더 행 제외하고 데이터만 저장
          setComputedData(evaluatedData.slice(1));
        }
        setPendingFormula(null);
        setInternalUpdate(false);
      }, 200);
    }
  }, [pendingFormula, setPendingFormula, setInternalUpdate, setComputedData]);

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
      <div className="example-controls-container bg-white border-b border-gray-200 p-4">
        {pendingFormula && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  포뮬러 적용 대기 중
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {pendingFormula.cellAddress}에 {pendingFormula.formula} 적용
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
      <div className="flex-1 overflow-auto">
        <HotTable
          ref={hotRef}
          rowHeaders={true}
          colHeaders={true}
          height="100%"
          autoWrapRow={true}
          autoWrapCol={true}
          minRows={8}
          minCols={rawCsvData?.headers.length || 6}
          minSpareCols={5} // 데이터 끝 이후 추가 열 생성
          minSpareRows={3} // 데이터 끝 이후 추가 행 생성
          manualColumnResize={true}
          manualRowResize={true}
          persistentState={true}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          wordWrap={true}
          readOnly={false}
          columnSorting={false} // 정렬 기능 비활성화 (오류의 원인이 될 수 있음)
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
            if (changes && rawCsvData) {
              changes.forEach(([row, col, , newValue]) => {
                if (typeof row === 'number' && typeof col === 'number') {
                  // 헤더 행 제외 (헤더가 첫 번째 행에 있으므로)
                  const dataRow = row - 1;
                  if (dataRow >= 0) {
                    updateCellData(dataRow, col, newValue?.toString() || '');
                  }
                }
              });
            }

            if (!isAutosave) {
              return;
            }
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