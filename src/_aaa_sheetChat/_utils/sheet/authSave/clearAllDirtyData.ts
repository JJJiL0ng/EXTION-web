// 모든 시트의 dirty/insert/delete 상태 초기화
export const clearAllDirtyData = (spread: any): void => {
  const sheetCount = spread.getSheetCount();
  for (let i = 0; i < sheetCount; i++) {
    const sheet = spread.getSheet(i);
    sheet.clearPendingChanges();
  }
};
