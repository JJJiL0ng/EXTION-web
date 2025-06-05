import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { HandsontableSettings } from './types';

interface SpreadsheetAreaProps {
  displayData: any[][];
  formulasConfig: DetailedSettings;
  handsontableSettings: HandsontableSettings;
  onAfterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => void;
  onCellSelection: (row: number, col: number) => void;
}

export interface SpreadsheetAreaRef {
  getHotInstance: () => Handsontable | null;
}

const SpreadsheetArea = forwardRef<SpreadsheetAreaRef, SpreadsheetAreaProps>(({
  displayData,
  formulasConfig,
  handsontableSettings,
  onAfterChange,
  onCellSelection
}, ref) => {
  const hotRef = useRef<HotTableRef>(null);

  useImperativeHandle(ref, () => ({
    getHotInstance: () => hotRef.current?.hotInstance || null
  }));

  return (
    <div className="flex-1 bg-white shadow-inner overflow-hidden" style={{ position: 'relative', zIndex: 50 }}>
      <HotTable
        ref={hotRef}
        rowHeaders={true}
        colHeaders={true}
        height="100%"
        width="100%"
        autoWrapRow={true}
        autoWrapCol={true}
        data={displayData}
        // 엑셀처럼 무제한 확장 가능하도록 설정
        {...handsontableSettings}
        // 행/열 자동 확장 설정
        allowInsertRow={true}
        allowInsertColumn={true}
        allowRemoveRow={true}
        allowRemoveColumn={true}
        // 가상화 설정으로 성능 최적화
        renderAllRows={false}
        renderAllColumns={false}
        viewportRowRenderingOffset={30}
        viewportColumnRenderingOffset={10}
        contextMenu={{
          items: {
            row_above: { name: '위에 행 삽입' },
            row_below: { name: '아래에 행 삽입' },
            remove_row: { name: '행 삭제' },
            separator1: '---------',
            col_left: { name: '왼쪽에 열 삽입' },
            col_right: { name: '오른쪽에 열 삽입' },
            remove_col: { name: '열 삭제' },
            separator2: '---------',
            undo: { name: '실행 취소' },
            redo: { name: '다시 실행' },
            cut: { name: '잘라내기' },
            copy: { name: '복사' },
            paste: { name: '붙여넣기' }
          }
        }}
        licenseKey="non-commercial-and-evaluation"
        formulas={formulasConfig}
        afterChange={onAfterChange}
        // 셀 선택 이벤트 처리
        afterSelection={(row, col) => {
          onCellSelection(row, col);
        }}
        afterSelectionEnd={(row, col) => {
          onCellSelection(row, col);
        }}
        // 셀 값 변경 후 포뮬러 업데이트 훅
        afterSetDataAtCell={() => {
          console.log('Data set, recalculating formulas...');

          // 100ms 후에 재렌더링 (포뮬러가 계산될 시간을 줌)
          setTimeout(() => {
            const currentHot = hotRef.current?.hotInstance;
            if (currentHot && !currentHot.isDestroyed) {
              try {
                currentHot.render();
              } catch (error) {
                console.warn('afterSetDataAtCell 렌더링 중 오류 (무시됨):', error);
              }
            }
          }, 100);
        }}
        // 행/열 추가 시 자동으로 데이터 확장
        afterCreateRow={(index, amount) => {
          console.log(`Added ${amount} rows at index ${index}`);
        }}
        afterCreateCol={(index, amount) => {
          console.log(`Added ${amount} columns at index ${index}`);
        }}
      />
    </div>
  );
});

SpreadsheetArea.displayName = 'SpreadsheetArea';

export default SpreadsheetArea; 