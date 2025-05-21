// utils/fileProcessing.ts - 수정된 버전
import * as XLSX from 'xlsx';

// 첫 번째 비어있지 않은 셀을 찾는 함수 (변경 없음)
export const findFirstNonEmptyCell = (data: string[][]): { row: number; col: number } => {
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      if (data[row][col] && data[row][col].toString().trim() !== '') {
        return { row, col };
      }
    }
  }
  return { row: 0, col: 0 };
};

// 헤더 행을 찾는 함수 (변경 없음)
export const findHeaderRow = (data: string[][], startRow: number = 0): number => {
  for (let row = startRow; row < data.length; row++) {
    let consecutiveNonEmpty = 0;
    let maxConsecutive = 0;
    
    for (let col = 0; col < data[row].length; col++) {
      if (data[row][col] && data[row][col].toString().trim() !== '') {
        consecutiveNonEmpty++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveNonEmpty);
      } else {
        consecutiveNonEmpty = 0;
      }
    }
    
    // 연속된 비어있지 않은 셀이 3개 이상이면 헤더로 간주
    if (maxConsecutive >= 3) {
      return row;
    }
  }
  return startRow;
};

// 전체 시트 크기를 찾는 함수 (새로 추가)
export const findSheetBounds = (data: string[][]): {
  maxRow: number;
  maxCol: number;
} => {
  let maxRow = 0;
  let maxCol = 0;
  
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      if (data[row][col] && data[row][col].toString().trim() !== '') {
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      }
    }
  }
  
  return { maxRow, maxCol };
};

// 헤더 정보만 추출하는 함수 (새로 추가)
export const extractValidHeaders = (headerRow: string[]): {
  headers: string[];
  headerMap: { [index: number]: number }; // 원본 인덱스 -> 헤더 인덱스 매핑
} => {
  const headers: string[] = [];
  const headerMap: { [index: number]: number } = {};
  
  headerRow.forEach((header, originalIndex) => {
    const trimmedHeader = header?.toString().trim();
    if (trimmedHeader && trimmedHeader !== '') {
      headerMap[originalIndex] = headers.length;
      headers.push(trimmedHeader);
    }
  });
  
  return { headers, headerMap };
};

// 유효한 데이터 범위 찾기 - 수정된 버전
export const findDataRange = (data: string[][], headerRow: number): {
  headerRowData: string[];
  validHeaders: string[];
  headerMap: { [index: number]: number };
  maxRow: number;
  maxCol: number;
  preserveOriginalStructure: boolean;
} => {
  const headerRowData = data[headerRow] || [];
  const { headers: validHeaders, headerMap } = extractValidHeaders(headerRowData);
  const { maxRow, maxCol } = findSheetBounds(data);
  
  return {
    headerRowData, // 원본 헤더 행 (공백 포함)
    validHeaders, // 유효한 헤더만 (공백 제외)
    headerMap, // 원본 인덱스 -> 헤더 인덱스 매핑
    maxRow: Math.max(maxRow, headerRow + 1), // 최소한 헤더 다음 행까지
    maxCol: Math.max(maxCol, headerRowData.length - 1),
    preserveOriginalStructure: true
  };
};

// 열 인덱스를 엑셀 열 이름으로 변환 (변경 없음)
export const columnIndexToLetter = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

// XLSX 파일 처리 함수 - 문제 해결 버전
export const processXLSXFile = async (file: File): Promise<{
  sheets: Array<{
    sheetName: string;
    rawData: string[][]; // 원본 데이터 (공백 포함)
    headers: string[]; // 유효한 헤더만
    data: string[][]; // 헤더에 맞춰 정리된 데이터
    metadata: {
      headerRow: number;
      headerRowData: string[]; // 원본 헤더 행
      headerMap: { [index: number]: number }; // 매핑 정보
      dataRange: {
        maxRow: number;
        maxCol: number;
        startColLetter: string;
        endColLetter: string;
      };
      preserveOriginalStructure: boolean;
    };
  }>;
  fileName: string;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 모든 시트를 처리
        const processedSheets = workbook.SheetNames.map(sheetName => {
          console.log(`Processing sheet: ${sheetName}`); // 디버깅을 위한 로그
          const worksheet = workbook.Sheets[sheetName];
          
          // 전체 시트를 2차원 배열로 변환 (빈 셀 유지)
          const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // 빈 셀을 빈 문자열로 처리
            raw: false, // 값을 문자열로 변환
            blankrows: true // 빈 행도 유지
          }) as string[][];
          
          console.log(`Raw data rows for ${sheetName}: ${rawData.length}`); // 시트 데이터 확인
          
          // 빈 시트 체크
          if (rawData.length === 0) {
            console.log(`Empty sheet: ${sheetName}`);
            return {
              sheetName,
              rawData: [[]],
              headers: [],
              data: [],
              metadata: {
                headerRow: 0,
                headerRowData: [],
                headerMap: {},
                dataRange: {
                  maxRow: 0,
                  maxCol: 0,
                  startColLetter: 'A',
                  endColLetter: 'A'
                },
                preserveOriginalStructure: true
              }
            };
          }
          
          // 헤더 행 찾기
          const headerRow = findHeaderRow(rawData);
          console.log(`Header row for ${sheetName}: ${headerRow}`);
          
          // 헤더 행이 존재하는지 확인
          if (!rawData[headerRow]) {
            console.error(`Invalid header row for ${sheetName}:`, headerRow);
            return {
              sheetName,
              rawData,
              headers: [],
              data: [],
              metadata: {
                headerRow: 0,
                headerRowData: [],
                headerMap: {},
                dataRange: {
                  maxRow: rawData.length - 1,
                  maxCol: 0,
                  startColLetter: 'A',
                  endColLetter: 'A'
                },
                preserveOriginalStructure: true
              }
            };
          }
          
          // 데이터 범위 및 헤더 정보 추출
          const {
            headerRowData,
            validHeaders,
            headerMap,
            maxRow,
            maxCol
          } = findDataRange(rawData, headerRow);
          
          console.log(`Valid headers for ${sheetName}:`, validHeaders);
          console.log(`Header map for ${sheetName}:`, headerMap);
          
          // 원본 구조를 유지하면서, 데이터만 헤더에 맞춰 정리
          const data: string[][] = [];
          
          // 헤더 다음 행부터 데이터 처리
          for (let row = headerRow + 1; row <= maxRow; row++) {
            if (!rawData[row]) continue; // 존재하지 않는 행은 건너뛰기
            
            const dataRow: string[] = [];
            const originalRow = rawData[row];
            
            // 유효한 헤더에 해당하는 열만 추출하되, 순서는 원본 순서 유지
            Object.keys(headerMap).forEach(originalIndexStr => {
              const originalIndex = parseInt(originalIndexStr);
              const cellValue = originalRow[originalIndex] || '';
              dataRow.push(String(cellValue)); // 명시적으로 문자열로 변환
            });
            
            data.push(dataRow);
          }
          
          console.log(`Data rows for ${sheetName}: ${data.length}`);
          
          return {
            sheetName,
            rawData, // 원본 데이터 보존
            headers: validHeaders, // 상태관리에는 유효한 헤더만
            data, // 헤더에 맞춰 정리된 데이터
            metadata: {
              headerRow,
              headerRowData, // 원본 헤더 행 보존
              headerMap, // 매핑 정보 보존
              dataRange: {
                maxRow,
                maxCol,
                startColLetter: columnIndexToLetter(0),
                endColLetter: columnIndexToLetter(maxCol)
              },
              preserveOriginalStructure: true
            }
          };
        });
        
        console.log(`Total sheets processed: ${processedSheets.length}`);
        
        resolve({
          sheets: processedSheets,
          fileName: file.name
        });
      } catch (error) {
        console.error('XLSX 파일 처리 오류:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      console.error('파일 읽기 오류');
      reject(new Error('파일 읽기 실패'));
    };
    reader.readAsArrayBuffer(file);
  });
};