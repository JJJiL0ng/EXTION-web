import { SheetData } from '@/stores/store-types';

// Handsontable에 표시할 데이터를 준비하는 헬퍼 함수
export const prepareDisplayData = (sheetData: SheetData | null): any[][] => {
  console.log('📊 prepareDisplayData 호출:', {
    hasSheetData: !!sheetData,
    hasRawData: !!(sheetData?.rawData),
    rawDataLength: sheetData?.rawData?.length || 0,
    sheetName: sheetData?.sheetName || 'No sheet'
  });

  // 시트 데이터가 없으면 기본 빈 시트 생성 (100행 x 26열)
  if (!sheetData || !sheetData.rawData || sheetData.rawData.length === 0) {
    const defaultRows = 100;
    const defaultCols = 26; // A-Z
    const defaultData = Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(''));
    console.log('📊 기본 빈 시트 생성:', { rows: defaultRows, cols: defaultCols });
    return defaultData;
  }

  const baseData = sheetData.rawData;

  // 엑셀처럼 추가적인 빈 행과 열을 제공하여 사용성 개선
  const currentRows = baseData.length;
  
  // 현재 데이터의 최대 열 개수 계산 (빈 배열 방지 및 안전한 계산)
  let currentCols = 0;
  for (const row of baseData) {
    if (row && Array.isArray(row) && row.length > currentCols) {
      currentCols = row.length;
    }
  }
  
  console.log('📊 원본 데이터 크기:', { currentRows, currentCols });

  // 최소 100행, 26열(A-Z)을 보장하고, 현재 데이터보다 50행, 10열을 더 추가
  const targetRows = Math.max(100, currentRows + 50);
  const targetCols = Math.max(26, currentCols + 10); // 원본이 34열이면 44열까지 확장

  console.log('📊 데이터 확장 계산:', {
    currentRows,
    currentCols,
    targetRows,
    targetCols,
    addedRows: targetRows - currentRows,
    addedCols: targetCols - currentCols
  });

  // 기존 데이터의 각 행을 목표 열 수만큼 확장
  const expandedData = baseData.map(row => {
    const expandedRow = [...(row || [])];
    while (expandedRow.length < targetCols) {
      expandedRow.push('');
    }
    return expandedRow;
  });

  // 목표 행 수만큼 추가 빈 행 생성
  while (expandedData.length < targetRows) {
    expandedData.push(Array(targetCols).fill(''));
  }

  console.log('📊 최종 확장된 데이터:', {
    finalRows: expandedData.length,
    finalCols: expandedData[0]?.length || 0,
    hasExtraRows: expandedData.length > currentRows,
    hasExtraCols: (expandedData[0]?.length || 0) > currentCols,
    // 열 헤더 확인용 (처음 5열과 마지막 5열)
    firstRowSample: expandedData[0]?.slice(0, 5),
    lastColumnsIndex: expandedData[0]?.length ? expandedData[0].length - 1 : 0,
    lastColumnsSample: expandedData[0]?.slice(-5)
  });

  return expandedData;
};

// CSV 데이터가 없을 때의 기본 설정
export const getDefaultData = () => Array(100).fill(null).map(() => Array(26).fill('')); 