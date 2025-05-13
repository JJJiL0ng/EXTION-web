// components/MainSpreadSheet.tsx
'use client'

import { useState, useRef, useEffect } from 'react';
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
  const [output, setOutput] = useState<string>('CSV 파일을 업로드하면 여기에 표시됩니다.');
  const [isAutosave] = useState<boolean>(false);

  // CSV 데이터가 업데이트될 때 스프레드시트 업데이트
  useEffect(() => {
    if (csvData && hotRef.current) {
      // 디버깅을 위한 로그
      console.log('MainSpreadSheet에서 받은 데이터:', csvData);
      console.log('데이터 행 수:', csvData.data.length);
      console.log('첫 번째 행:', csvData.data[0]);
      
      // 빈 행 제거
      const validData = csvData.data.filter(row => row && row.length > 0);
      
      // 헤더와 데이터를 합쳐서 전체 데이터 구성
      const allData = [csvData.headers, ...validData];
      
      // 스프레드시트에 데이터 로드
      const hotInstance = hotRef.current.hotInstance;
      if (hotInstance) {
        hotInstance.loadData(allData);
        setOutput(`${csvData.fileName} 파일이 로드되었습니다. (${validData.length}행)`);
      }
    }
  }, [csvData]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="example-controls-container bg-white border-b border-gray-200 p-4">
        <div className="console text-sm text-gray-600" id="output">
          {output}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <HotTable
          ref={hotRef}
          startRows={csvData ? csvData.data.length : 8}
          startCols={csvData ? csvData.headers.length : 6}
          rowHeaders={true}
          colHeaders={csvData ? csvData.headers : true}
          height="100%"
          autoWrapRow={true}
          autoWrapCol={true}
          minRows={8}
          minCols={csvData ? csvData.headers.length : 20}
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
          data={csvData ? [csvData.headers, ...csvData.data.filter(row => row && row.length > 0)] : []}
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
              setOutput(
                `Autosaved (${change?.length} cell${
                  (change?.length || 0) > 1 ? 's' : ''
                })`
              );
              console.log(
                'The POST request is only used here for the demo purposes'
              );
            });
          }}
        />
      </div>
    </div>
  );
};

export default MainSpreadSheet;