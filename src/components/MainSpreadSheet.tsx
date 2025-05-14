// components/MainSpreadSheet.tsx
'use client'

import { useState, useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import { useCSV } from '../contexts/CSVContext';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

registerAllModules();

const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  const { csvData, isLoading } = useCSV();
  const [output] = useState<string>('CSV 파일을 업로드하면 여기에 표시됩니다.');
  const [isAutosave] = useState<boolean>(false);

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
    ['', '', '', '', '', '']
  ];

  // CSV 데이터 처리
  const processedData = csvData?.data.filter(row => row && row.length > 0) || defaultData;
  const headers = csvData?.headers || [];

  return (
    <div className="h-full flex flex-col">
      <div className="example-controls-container bg-white border-b border-gray-200 p-4">
        <div className="console text-sm text-gray-600" id="output">
          {csvData ? `${csvData.fileName} 파일이 로드되었습니다. (${processedData.length}행)` : output}
        </div>
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