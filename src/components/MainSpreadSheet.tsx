// components/MainSpreadSheet.tsx
'use client'

import { useState, useRef, useEffect } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import { useCSV } from '../contexts/CSVContext';
import { useSpreadsheetStore } from '../stores/useSpreadsheetStore';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

registerAllModules();

const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  const { csvData, isLoading } = useCSV();
  const { updateSheetContext } = useSpreadsheetStore();
  const [isAutosave] = useState<boolean>(false);

  // CSV 데이터가 변경될 때마다 Zustand 스토어 업데이트
  useEffect(() => {
    if (csvData) {
      updateSheetContext(csvData);
    }
  }, [csvData, updateSheetContext]);

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
        {/* TODO: 향후 여기에 컨트롤 추가 가능 */}
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
          afterChange={function (
            change: Handsontable.CellChange[] | null,
            source: Handsontable.ChangeSource
          ) {
            if (source === 'loadData') {
              return; // don't save this change
            }

            // TODO: 스프레드시트 변경사항을 Zustand 스토어에 반영
            // 현재 CSV 데이터를 업데이트하여 포뮬러 생성 시 최신 데이터 사용
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