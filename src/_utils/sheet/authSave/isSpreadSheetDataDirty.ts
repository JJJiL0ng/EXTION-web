// filename: detectSheetChanges.ts

import GC from '@mescius/spread-sheets';

// SpreadJS Workbook의 모든 시트에 대해 dirty 여부를 판별
export const isSpreadSheetDataDirty = (spread: any): boolean => {
  const sheetNums = spread.getSheetCount();
  for (let i = 0; i < sheetNums; i++) {
    const sheet = spread.getSheet(i);
    const dirtyCells = sheet.getDirtyCells(0, 0, sheet.getRowCount(), sheet.getColumnCount());
    const dirtyRows = sheet.getDirtyRows();
    const insertedRows = sheet.getInsertRows();
    const deletedRows = sheet.getDeletedRows();

    if (
      dirtyCells.length > 0 ||
      dirtyRows.length > 0 ||
      insertedRows.length > 0 ||
      deletedRows.length > 0
    ) {
      return true; // 하나라도 있으면 바로 true
    }
  }
  return false; // 모든 시트에 없으면 false
};
