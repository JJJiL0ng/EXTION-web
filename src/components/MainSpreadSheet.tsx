'use client'

import { useState, useRef, MouseEvent } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

// import { HyperFormula } from 'hyperformula';


registerAllModules();

//  //  create an external HyperFormula instance
//  const hyperformulaInstance = HyperFormula.buildEmpty({
//   // to use an external HyperFormula instance,
//   // initialize it with the `'internal-use-in-handsontable'` license key
//   licenseKey: 'internal-use-in-handsontable',
// });


const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [output, setOutput] = useState<string>(
    'Click "Load" to load data from server'
  );

  const [isAutosave, setIsAutosave] = useState<boolean>(false);

  const autosaveClickCallback = (event: MouseEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;

    setIsAutosave(target.checked);

    if (target.checked) {
      setOutput('Changes will be autosaved');
    } else {
      setOutput('Changes will not be autosaved');
    }
  };
const loadClickCallback = (event: MouseEvent<HTMLButtonElement>) => {
    const hot = hotRef.current?.hotInstance;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .xlsx';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // CSV 파일만 인코딩 처리 (XLSX는 다른 방식으로 처리 필요)
          if (file.name.endsWith('.csv')) {
            const arrayBuffer = await file.arrayBuffer();
            
            // 인코딩 자동 감지를 위해 jschardet 패키지 사용 (선택사항)
            // 또는 간단히 EUC-KR로 시도해볼 수 있음
            
            // 방법 1: EUC-KR로 시도 (한국에서 많이 사용)
            let decoder = new TextDecoder('euc-kr');
            let data = decoder.decode(arrayBuffer);
            
            // BOM이나 특정 문자가 깨졌는지 확인 후 fallback
            if (data.includes('�') || data.startsWith('ï»¿')) {
              decoder = new TextDecoder('utf-8');
              data = decoder.decode(arrayBuffer);
            }
            
            const rows = data.split('\n').map(row => row.split(','));
            hot?.loadData(rows);
            setOutput('Data loaded');
          } else {
            // XLSX 파일은 기존 방식 또는 다른 라이브러리 사용
            // 예: SheetJS 등을 사용해야 함
            const reader = new FileReader();
            reader.onload = (e) => {
              const data = e.target?.result;
              if (data) {
                // XLSX 처리 로직
                setOutput('XLSX file support needs additional library');
              }
            };
            reader.readAsArrayBuffer(file);
          }
        } catch (error) {
          console.error('File reading error:', error);
          setOutput('Error loading file');
        }
      }
    };
    fileInput.click();
    console.log(event);
  };

  const saveClickCallback = (event: MouseEvent<HTMLButtonElement>) => {
    const hot = hotRef.current?.hotInstance;
    const data = hot?.getData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "data.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOutput('Data saved');
    console.log(event);
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button
            id="load"
            className="button button--primary button--blue"
            onClick={loadClickCallback}
          >
            Load data
          </button>
          &nbsp;
          <button
            id="save"
            className="button button--primary button--blue"
            onClick={saveClickCallback}
          >
            Save data
          </button>
          <label>
            <input
              type="checkbox"
              name="autosave"
              id="autosave"
              checked={isAutosave}
              onClick={autosaveClickCallback}
            />
            Autosave
          </label>
        </div>
        <output className="console" id="output">
          {output}
        </output>
      </div>
      <HotTable
        ref={hotRef}
        startRows={8}
        startCols={6}
        rowHeaders={true}
        colHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        minRows={50}
        minCols={80}
        persistentState={true}
        licenseKey="non-commercial-and-evaluation"
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
    </>
    
  );
};

export default MainSpreadSheet;