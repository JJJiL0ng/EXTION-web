import Handsontable from 'handsontable';
import { HotTableRef } from '@handsontable/react-wrapper';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import { SheetData } from '@/stores/store-types';

interface HotSettingsProps {
  activeSheetData: SheetData | null;
  formulasConfig: DetailedSettings;
  isInternalUpdate: boolean;
  handleAfterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => void;
  handleCellSelection: (row: number, col: number) => void;
  hotRef: React.RefObject<HotTableRef>;
}

const getSizingSettings = (activeSheetData: SheetData | null) => {
  const minRows = 100;
  const minCols = 26;

  if (!activeSheetData) {
    return {
      minRows,
      minCols,
      startRows: minRows,
      startCols: minCols,
      maxRows: 10000,
      maxCols: 100
    };
  }

  const rawRows = activeSheetData.rawData?.length || 0;
  const rawCols = activeSheetData.rawData?.[0]?.length || 0;
  
  const calculatedRows = Math.max(minRows, rawRows + 50);
  const calculatedCols = Math.max(minCols, rawCols + 10);

  return {
    minRows: calculatedRows,
    minCols: calculatedCols,
    startRows: calculatedRows,
    startCols: calculatedCols,
    maxRows: 10000,
    maxCols: 100
  };
};

export const getHotTableSettings = ({
  activeSheetData,
  formulasConfig,
  isInternalUpdate,
  handleAfterChange,
  handleCellSelection,
  hotRef,
}: HotSettingsProps): Handsontable.GridSettings => {
  return {
    rowHeaders: true,
    colHeaders: true,
    height: "100%",
    width: "100%",
    autoWrapRow: true,
    autoWrapCol: true,
    readOnly: false,
    fillHandle: true,
    manualColumnResize: true,
    manualRowResize: true,
    stretchH: "all",
    ...getSizingSettings(activeSheetData),
    allowInsertRow: true,
    allowInsertColumn: true,
    allowRemoveRow: true,
    allowRemoveColumn: true,
    renderAllRows: false,
    renderAllColumns: false,
    viewportRowRenderingOffset: 30,
    viewportColumnRenderingOffset: 10,
    contextMenu: true,
    licenseKey: "non-commercial-and-evaluation",
    formulas: formulasConfig,
    beforeChange: (changes, source) => {
      if (!isInternalUpdate && changes && source !== 'loadData') {
        console.log('Data changing:', changes, 'Source:', source);
      }
    },
    afterChange: handleAfterChange,
    afterSelection: (row, col) => {
      handleCellSelection(row, col);
    },
    afterSelectionEnd: (row, col) => {
      handleCellSelection(row, col);
    },
    afterSetDataAtCell: () => {
      console.log('Data set, recalculating formulas...');
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
    },
    afterCreateRow: (index, amount) => {
      console.log(`Added ${amount} rows at index ${index}`);
    },
    afterCreateCol: (index, amount) => {
      console.log(`Added ${amount} columns at index ${index}`);
    },
  };
}; 