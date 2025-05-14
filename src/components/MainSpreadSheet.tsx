// components/MainSpreadSheet.tsx
'use client'

import { useState, useRef, useEffect } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { useCSV } from '../contexts/CSVContext';
import { useSpreadsheetStore, cellAddressToCoords } from '../stores/useSpreadsheetStore';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

registerAllModules();

// 공유 HyperFormula 인스턴스 생성
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  const { csvData, isLoading } = useCSV();
  const { updateSheetContext, pendingFormula, setPendingFormula } = useSpreadsheetStore();
  const [isAutosave] = useState<boolean>(false);

  // HyperFormula 설정
  const [formulasConfig] = useState<DetailedSettings>({
    engine: hyperformulaInstance,
    namedExpressions: [],
  });

  // CSV 데이터가 변경될 때마다 Zustand 스토어 업데이트
  useEffect(() => {
    if (csvData) {
      updateSheetContext(csvData);
    }
  }, [csvData, updateSheetContext]);

  // 포뮬러 적용을 위한 useEffect
  useEffect(() => {
    if (pendingFormula && hotRef.current?.hotInstance) {
      applyFormulaToCell(pendingFormula.formula, pendingFormula.cellAddress);
      // 적용 후 pending formula 클리어
      setPendingFormula(null);
    }
  }, [pendingFormula, setPendingFormula]);

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
      
      // 직접 셀에 함수 설정
      hot.setDataAtCell(row, col, formula);
      
      // 강제 재렌더링
      hot.render();
      
      console.log('Formula applied successfully');
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
      
      // 셀에 네임드 익스프레션 참조 설정
      const { row, col } = cellAddressToCoords(cellAddress);
      hot?.setDataAtCell(row, col, `=${namedExpName}`);
      
      // 재렌더링
      hot?.render();
      
      console.log(`Applied formula using named expression: ${namedExpName}`);
    } catch (error) {
      console.error('Named expression approach also failed:', error);
    }
  };

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">파일을 처리하는 중...</p>
        </div>
      </div>
    );
  }

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

  // CSV 데이터 처리
  const processedData = csvData?.data.filter(row => row && row.length > 0) || defaultData;
  const headers = csvData?.headers || [];

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
          colHeaders={headers.length > 0 ? headers : true}
          height="100%"
          autoWrapRow={true}
          autoWrapCol={true}
          minRows={8}
          minCols={headers.length > 0 ? headers.length : 6}
          manualColumnResize={true}
          manualRowResize={true}
          persistentState={true}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          wordWrap={true}
          readOnly={false}
          columnSorting={true}
          filters={true}
          contextMenu={true}
          dropdownMenu={true}
          data={processedData}
          formulas={formulasConfig}
          afterChange={function (
            change: Handsontable.CellChange[] | null,
            source: Handsontable.ChangeSource
          ) {
            if (source === 'loadData') {
              return; // don't save this change
            }

            // 스프레드시트 변경사항을 Zustand 스토어에 반영
            if (change && csvData) {
              const updatedData = [...csvData.data];
              change.forEach(([row, col, , newValue]) => {
                if (typeof row === 'number' && typeof col === 'number' && updatedData[row]) {
                  updatedData[row][col] = newValue?.toString() || '';
                }
              });
              
              const updatedCsvData = {
                ...csvData,
                data: updatedData
              };
              
              // Zustand 스토어 업데이트
              updateSheetContext(updatedCsvData);
            }

            if (!isAutosave) {
              return;
            }

            fetch('https://handsontable.com/docs/scripts/json/save.json', {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ data: change }),
            }).then(() => {
              if (change) {
                console.log(
                  `Autosaved (${change.length} cell${change.length > 1 ? 's' : ''})`
                );
              }
            });
          }}
        />
      </div>
    </div>
  );
};

export default MainSpreadSheet;