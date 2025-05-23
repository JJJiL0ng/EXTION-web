// utils/fileProcessing.ts - 원본 구조 완전 보존 버전
import * as XLSX from 'xlsx';

// ============================================================================
// 상태 관리 인터페이스 확장 (기존 코드와 호환성 유지)
// ============================================================================

// 기존 SheetData 인터페이스 확장
export interface ExtendedSheetData {
  sheetName: string;
  headers: string[]; // 기존 호환성 유지
  data: string[][]; // 기존 호환성 유지
  rawData: string[][]; // 완전한 원본 데이터
  
  // 새로 추가된 상세 정보
  headerInfo: {
    headerRow: number; // 실제 헤더가 위치한 행
    headerDetails: Array<{
      name: string;
      originalColumn: number;
      columnLetter: string;
    }>;
    headerPositions: { [originalCol: number]: number };
  };
  
  dataBounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
    actualStartRow: number; // 실제 데이터 시작 행
    actualStartCol: number; // 실제 데이터 시작 열
  };
  
  metadata?: {
    rowCount: number;
    columnCount: number;
    headerRow: number;
    headerRowData?: string[];
    headerMap?: { [index: number]: number };
    dataRange: {
      startRow: number;
      endRow: number;
      startCol: number;
      endCol: number;
      startColLetter: string;
      endColLetter: string;
    };
    preserveOriginalStructure?: boolean;
    lastModified?: Date;
    // 새로 추가된 원본 구조 정보
    originalHeaderRow?: number;
    originalDataBounds?: {
      minRow: number;
      maxRow: number;
      minCol: number;
      maxCol: number;
      actualStartRow: number;
      actualStartCol: number;
    };
    headerDetails?: Array<{
      name: string;
      originalColumn: number;
      columnLetter: string;
    }>;
  };
}

// ============================================================================
// Zustand 스토어 수정 - 원본 구조 정보 추가
// ============================================================================

// useUnifiedDataStore.ts에 추가할 액션들
export interface ExtendedStoreActions {
  // 원본 셀 좌표를 Handsontable 좌표로 변환
  convertToTableCoords: (originalRow: number, originalCol: number, sheetIndex?: number) => {
    tableRow: number;
    tableCol: number;
  };
  
  // Handsontable 좌표를 원본 셀 좌표로 변환
  convertToOriginalCoords: (tableRow: number, tableCol: number, sheetIndex?: number) => {
    originalRow: number;
    originalCol: number;
  };
  
  // 원본 구조를 유지한 채로 셀 값 업데이트
  updateCellAtOriginalPosition: (originalRow: number, originalCol: number, value: string, sheetIndex?: number) => void;
  
  // 헤더 정보 가져오기
  getHeaderInfo: (sheetIndex?: number) => ExtendedSheetData['headerInfo'] | null;
  
  // 실제 데이터 범위 가져오기
  getDataBounds: (sheetIndex?: number) => ExtendedSheetData['dataBounds'] | null;
}

// ============================================================================
// 핵심 유틸리티 함수들
// ============================================================================

// 첫 번째 비어있지 않은 셀을 찾는 함수
export const findFirstNonEmptyCell = (data: string[][]): { row: number; col: number } => {
  for (let row = 0; row < data.length; row++) {
    if (!data[row]) continue;
    for (let col = 0; col < data[row].length; col++) {
      if (data[row][col] && data[row][col].toString().trim() !== '') {
        return { row, col };
      }
    }
  }
  return { row: 0, col: 0 };
};

// 헤더 행을 찾는 함수 - 개선된 버전
export const findHeaderRow = (data: string[][], startRow: number = 0): number => {
  let bestHeaderRow = startRow;
  let bestScore = 0;
  
  for (let row = startRow; row < Math.min(data.length, startRow + 10); row++) {
    if (!data[row]) continue;
    
    let nonEmptyCount = 0;
    let consecutiveNonEmpty = 0;
    let maxConsecutive = 0;
    let textCount = 0; // 텍스트 셀 개수
    
    for (let col = 0; col < data[row].length; col++) {
      const cellValue = data[row][col];
      const cellStr = cellValue ? cellValue.toString().trim() : '';
      
      if (cellStr !== '') {
        nonEmptyCount++;
        consecutiveNonEmpty++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveNonEmpty);
        
        // 숫자가 아닌 텍스트인 경우 (헤더일 가능성 높음)
        if (isNaN(Number(cellStr)) || cellStr.length > 10) {
          textCount++;
        }
      } else {
        consecutiveNonEmpty = 0;
      }
    }
    
    // 헤더 점수 계산
    const score = (maxConsecutive * 2) + (textCount * 1.5) + (nonEmptyCount * 0.5);
    
    // 최소 조건: 연속된 비어있지 않은 셀이 2개 이상, 전체 비어있지 않은 셀이 2개 이상
    if (maxConsecutive >= 2 && nonEmptyCount >= 2 && score > bestScore) {
      bestScore = score;
      bestHeaderRow = row;
    }
  }
  
  return bestHeaderRow;
};

// 실제 데이터 범위를 찾는 함수
export const findActualDataBounds = (data: string[][]): {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
} => {
  let minRow = data.length;
  let maxRow = -1;
  let minCol = Number.MAX_SAFE_INTEGER;
  let maxCol = -1;
  
  for (let row = 0; row < data.length; row++) {
    if (!data[row]) continue;
    
    let hasData = false;
    for (let col = 0; col < data[row].length; col++) {
      const cellValue = data[row][col];
      if (cellValue && cellValue.toString().trim() !== '') {
        hasData = true;
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
    
    if (hasData) {
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
    }
  }
  
  // 데이터가 없는 경우 기본값 반환
  if (maxRow === -1) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }
  
  return { minRow, maxRow, minCol, maxCol };
};

// 헤더 정보 추출 - 원본 위치 정보 포함
export const extractHeaderInfo = (headerRow: string[], headerRowIndex: number): {
  headers: Array<{
    name: string;
    originalColumn: number;
    columnLetter: string;
  }>;
  headerPositions: { [originalCol: number]: number }; // 원본 열 -> 헤더 배열 인덱스
} => {
  const headers: Array<{
    name: string;
    originalColumn: number;
    columnLetter: string;
  }> = [];
  
  const headerPositions: { [originalCol: number]: number } = {};
  
  headerRow.forEach((header, originalCol) => {
    const headerStr = String(header || '').trim();
    if (headerStr && headerStr !== '') {
      const headerIndex = headers.length;
      headerPositions[originalCol] = headerIndex;
      
      headers.push({
        name: headerStr,
        originalColumn: originalCol,
        columnLetter: columnIndexToLetter(originalCol)
      });
    }
  });
  
  return { headers, headerPositions };
};

// 열 인덱스를 엑셀 열 이름으로 변환
export const columnIndexToLetter = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

// 엑셀 열 이름을 인덱스로 변환
export const columnLetterToIndex = (letter: string): number => {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result - 1;
};

// ============================================================================
// MainSpreadSheet 컴포넌트에서 사용할 함수들
// ============================================================================

// Handsontable에 표시할 데이터 생성 (원본 구조 유지)
export const prepareDataForHandsontable = (sheetData: ExtendedSheetData): {
  displayData: string[][];
  headerRowIndex: number;
  dataStartRow: number;
  displayOffsets: {
    rowOffset: number;
    colOffset: number;
  };
} => {
  if (!sheetData.rawData || sheetData.rawData.length === 0) {
    return {
      displayData: [[]],
      headerRowIndex: 0,
      dataStartRow: 1,
      displayOffsets: { rowOffset: 0, colOffset: 0 }
    };
  }
  
  // 원본 데이터를 그대로 사용하되, 필요한 범위만 표시
  const { rawData, dataBounds, headerInfo } = sheetData;
  const { minRow, maxRow, minCol, maxCol } = dataBounds;
  
  // 표시할 데이터 범위 결정 (여백 포함)
  const displayStartRow = Math.max(0, minRow - 2); // 헤더 위 2줄 여백
  const displayEndRow = Math.min(rawData.length - 1, maxRow + 10); // 데이터 아래 10줄 여백
  const displayStartCol = Math.max(0, minCol - 1); // 헤더 좌측 1열 여백
  const displayEndCol = maxCol + 10; // 데이터 우측 10열 여백
  
  // 표시할 데이터 배열 생성
  const displayData: string[][] = [];
  
  for (let row = displayStartRow; row <= displayEndRow; row++) {
    const displayRow: string[] = [];
    for (let col = displayStartCol; col <= displayEndCol; col++) {
      const cellValue = rawData[row]?.[col] || '';
      displayRow.push(String(cellValue));
    }
    displayData.push(displayRow);
  }
  
  return {
    displayData,
    headerRowIndex: headerInfo.headerRow - displayStartRow,
    dataStartRow: Math.max(headerInfo.headerRow + 1, minRow) - displayStartRow,
    displayOffsets: {
      rowOffset: displayStartRow,
      colOffset: displayStartCol
    }
  };
};

// 셀 선택 시 원본 좌표 정보 반환
export const getCellOriginalInfo = (
  tableRow: number, 
  tableCol: number, 
  sheetData: ExtendedSheetData,
  displayOffsets: { rowOffset: number; colOffset: number }
) => {
  const originalRow = tableRow + displayOffsets.rowOffset;
  const originalCol = tableCol + displayOffsets.colOffset;
  
  // 실제 엑셀 셀 주소 계산
  const excelAddress = `${columnIndexToLetter(originalCol)}${originalRow + 1}`;
  
  // 헤더인지 확인
  const isHeader = originalRow === sheetData.headerInfo.headerRow;
  
  // 데이터 영역인지 확인
  const { minRow, maxRow, minCol, maxCol } = sheetData.dataBounds;
  const isInDataBounds = originalRow >= minRow && originalRow <= maxRow && 
                         originalCol >= minCol && originalCol <= maxCol;
  
  // 헤더 정보 찾기
  const headerInfo = isHeader ? 
    sheetData.headerInfo.headerDetails.find(h => h.originalColumn === originalCol) : 
    undefined;
  
  return {
    originalRow,
    originalCol,
    excelAddress,
    isHeader,
    isInDataBounds,
    cellValue: sheetData.rawData[originalRow]?.[originalCol] || '',
    headerInfo,
    headerName: headerInfo?.name,
    columnLetter: columnIndexToLetter(originalCol)
  };
};

// ============================================================================
// 파일 처리 메인 함수들
// ============================================================================

// XLSX 파일 처리 함수 - 원본 구조 완전 보존 버전
export const processXLSXFile = async (file: File): Promise<{
  sheets: Array<ExtendedSheetData>;
  fileName: string;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellFormula: true, // 수식 보존
          cellStyles: true,  // 스타일 보존
          cellDates: true    // 날짜 보존
        });
        
        const processedSheets: ExtendedSheetData[] = workbook.SheetNames.map(sheetName => {
          console.log(`Processing sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          
          // 원본 데이터 추출 - 완전한 원본 구조 유지
          const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // 빈 셀을 빈 문자열로 처리
            raw: false, // 값을 문자열로 변환
            blankrows: true, // 빈 행 유지
            range: undefined // 전체 범위 사용
          }) as string[][];
          
          console.log(`Raw data dimensions for ${sheetName}: ${rawData.length} rows`);
          
          // 빈 시트 처리
          if (rawData.length === 0) {
            return {
              sheetName,
              rawData: [[]],
              headers: [],
              data: [],
              headerInfo: {
                headerRow: 0,
                headerDetails: [],
                headerPositions: {}
              },
              dataBounds: {
                minRow: 0, maxRow: 0, minCol: 0, maxCol: 0,
                actualStartRow: 0, actualStartCol: 0
              },
              metadata: {
                headerRow: 0,
                rowCount: 0,
                columnCount: 0,
                dataRange: {
                  startRow: 0, endRow: 0, startCol: 0, endCol: 0,
                  startColLetter: 'A', endColLetter: 'A'
                },
                preserveOriginalStructure: true,
                lastModified: new Date()
              }
            };
          }
          
          // 실제 데이터 범위 찾기
          const dataBounds = findActualDataBounds(rawData);
          console.log(`Data bounds for ${sheetName}:`, dataBounds);
          
          // 헤더 행 찾기
          const headerRowIndex = findHeaderRow(rawData, dataBounds.minRow);
          console.log(`Header row for ${sheetName}: ${headerRowIndex}`);
          
          // 헤더 정보 추출
          const headerRowData = rawData[headerRowIndex] || [];
          const { headers: headerDetails, headerPositions } = extractHeaderInfo(headerRowData, headerRowIndex);
          
          console.log(`Headers found in ${sheetName}:`, headerDetails.map(h => `${h.name}(${h.columnLetter})`));
          
          // 기존 호환성을 위한 단순한 배열 생성
          const simpleHeaders = headerDetails.map(h => h.name);
          
          // 기존 호환성을 위한 데이터 배열 생성 (헤더 기준으로 정리)
          const processedData: string[][] = [];
          const dataStartRow = Math.max(headerRowIndex + 1, dataBounds.minRow);
          
          for (let row = dataStartRow; row <= dataBounds.maxRow; row++) {
            if (!rawData[row]) continue;
            
            const dataRow: string[] = [];
            headerDetails.forEach(headerInfo => {
              const cellValue = rawData[row][headerInfo.originalColumn] || '';
              dataRow.push(String(cellValue));
            });
            
            // 빈 행이 아닌 경우만 추가
            if (dataRow.some(cell => cell.trim() !== '')) {
              processedData.push(dataRow);
            }
          }
          
          console.log(`Processed ${processedData.length} data rows for ${sheetName}`);
          
          const result: ExtendedSheetData = {
            sheetName,
            rawData, // 완전한 원본 보존
            headers: simpleHeaders, // 기존 호환성
            data: processedData, // 기존 호환성
            headerInfo: {
              headerRow: headerRowIndex,
              headerDetails,
              headerPositions
            },
            dataBounds: {
              ...dataBounds,
              actualStartRow: headerRowIndex,
              actualStartCol: dataBounds.minCol
            },
            metadata: {
              headerRow: headerRowIndex,
              headerRowData,
              headerMap: headerPositions,
              rowCount: processedData.length,
              columnCount: simpleHeaders.length,
              dataRange: {
                startRow: dataStartRow,
                endRow: dataBounds.maxRow,
                startCol: dataBounds.minCol,
                endCol: dataBounds.maxCol,
                startColLetter: columnIndexToLetter(dataBounds.minCol),
                endColLetter: columnIndexToLetter(dataBounds.maxCol)
              },
              preserveOriginalStructure: true,
              lastModified: new Date(),
              // 새로 추가된 원본 구조 정보
              originalHeaderRow: headerRowIndex,
              originalDataBounds: {
                ...dataBounds,
                actualStartRow: headerRowIndex,
                actualStartCol: dataBounds.minCol
              },
              headerDetails
            }
          };
          
          return result;
        });
        
        console.log(`Successfully processed ${processedSheets.length} sheets from ${file.name}`);
        
        resolve({
          sheets: processedSheets,
          fileName: file.name
        });
      } catch (error) {
        console.error('XLSX 파일 처리 오류:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
};

// CSV 파일 처리 함수 - 원본 구조 보존
export const processCSVFile = async (file: File, fileContent: string): Promise<ExtendedSheetData> => {
  return new Promise((resolve, reject) => {
    // Papa.parse를 동적으로 import (이미 프로젝트에 설치되어 있다고 가정)
    const Papa = require('papaparse');
    
    Papa.parse(fileContent, {
      header: false,
      skipEmptyLines: false,
      delimiter: '', // 자동 감지
      complete: (results: any) => {
        try {
          const rawData = results.data as string[][];
          
          if (rawData.length <= 1) {
            throw new Error('파일에 충분한 데이터가 없습니다. 헤더와 최소 1개 데이터 행이 필요합니다.');
          }
          
          console.log(`CSV raw data: ${rawData.length} rows`);
          
          const dataBounds = findActualDataBounds(rawData);
          const headerRowIndex = findHeaderRow(rawData, dataBounds.minRow);
          const headerRowData = rawData[headerRowIndex] || [];
          const { headers: headerDetails, headerPositions } = extractHeaderInfo(headerRowData, headerRowIndex);
          
          console.log(`CSV headers found:`, headerDetails.map(h => `${h.name}(${h.columnLetter})`));
          
          const simpleHeaders = headerDetails.map(h => h.name);
          const processedData: string[][] = [];
          const dataStartRow = Math.max(headerRowIndex + 1, dataBounds.minRow);
          
          for (let row = dataStartRow; row <= dataBounds.maxRow; row++) {
            if (!rawData[row]) continue;
            
            const dataRow: string[] = [];
            headerDetails.forEach(headerInfo => {
              const cellValue = rawData[row][headerInfo.originalColumn] || '';
              dataRow.push(String(cellValue));
            });
            
            if (dataRow.some(cell => cell.trim() !== '')) {
              processedData.push(dataRow);
            }
          }
          
          console.log(`Processed ${processedData.length} CSV data rows`);
          
          const result: ExtendedSheetData = {
            sheetName: file.name.replace('.csv', ''),
            rawData,
            headers: simpleHeaders,
            data: processedData,
            headerInfo: {
              headerRow: headerRowIndex,
              headerDetails,
              headerPositions
            },
            dataBounds: {
              ...dataBounds,
              actualStartRow: headerRowIndex,
              actualStartCol: dataBounds.minCol
            },
            metadata: {
              headerRow: headerRowIndex,
              headerRowData,
              headerMap: headerPositions,
              rowCount: processedData.length,
              columnCount: simpleHeaders.length,
              dataRange: {
                startRow: dataStartRow,
                endRow: dataBounds.maxRow,
                startCol: dataBounds.minCol,
                endCol: dataBounds.maxCol,
                startColLetter: columnIndexToLetter(dataBounds.minCol),
                endColLetter: columnIndexToLetter(dataBounds.maxCol)
              },
              preserveOriginalStructure: true,
              lastModified: new Date(),
              originalHeaderRow: headerRowIndex,
              originalDataBounds: {
                ...dataBounds,
                actualStartRow: headerRowIndex,
                actualStartCol: dataBounds.minCol
              },
              headerDetails
            }
          };
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        console.error('CSV 파싱 오류:', error);
        reject(new Error(`CSV 파싱 실패: ${error.message}`));
      }
    });
  });
};

// ============================================================================
// 유틸리티 함수들
// ============================================================================

// 데이터 유효성 검사
export const validateSheetData = (sheetData: ExtendedSheetData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 기본 구조 검사
  if (!sheetData.rawData || sheetData.rawData.length === 0) {
    errors.push('원본 데이터가 없습니다.');
  }
  
  if (!sheetData.headerInfo || sheetData.headerInfo.headerDetails.length === 0) {
    errors.push('유효한 헤더를 찾을 수 없습니다.');
  }
  
  // 데이터 일관성 검사
  if (sheetData.headers.length !== sheetData.headerInfo.headerDetails.length) {
    warnings.push('헤더 배열과 상세 헤더 정보의 개수가 일치하지 않습니다.');
  }
  
  // 데이터 범위 검사
  const { minRow, maxRow, minCol, maxCol } = sheetData.dataBounds;
  if (minRow > maxRow || minCol > maxCol) {
    errors.push('데이터 범위가 유효하지 않습니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// 디버깅을 위한 시트 정보 출력
export const debugSheetInfo = (sheetData: ExtendedSheetData): void => {
  console.group(`📊 Sheet Debug Info: ${sheetData.sheetName}`);
  console.log('📐 Raw Data Dimensions:', `${sheetData.rawData.length} rows × ${sheetData.rawData[0]?.length || 0} cols`);
  console.log('📍 Header Row:', sheetData.headerInfo.headerRow);
  console.log('🏷️ Headers:', sheetData.headerInfo.headerDetails.map(h => `${h.name}(${h.columnLetter})`));
  console.log('📊 Data Bounds:', sheetData.dataBounds);
  console.log('📋 Processed Data:', `${sheetData.data.length} rows × ${sheetData.headers.length} cols`);
  
  // 샘플 데이터 출력 (처음 3행)
  if (sheetData.data.length > 0) {
    console.log('📝 Sample Data:');
    console.table(sheetData.data.slice(0, 3));
  }
  
  console.groupEnd();
};

// 성능 측정을 위한 함수
export const measureProcessingTime = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    console.log(`⏱️ ${operationName} completed in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`❌ ${operationName} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    throw error;
  }
};