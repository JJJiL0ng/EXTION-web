// utils/fileProcessing.ts
import * as XLSX from 'xlsx';

// 첫 번째 비어있지 않은 셀을 찾는 함수
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

// 헤더 행을 찾는 함수 (첫 번째 비어있지 않은 연속된 셀들이 있는 행)
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

// 유효한 데이터 범위 찾기
export const findDataRange = (data: string[][], headerRow: number): {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
} => {
  const headers = data[headerRow] || [];
  let startCol = 0;
  let endCol = headers.length - 1;
  
  // 시작 열 찾기 (첫 번째 비어있지 않은 헤더)
  for (let col = 0; col < headers.length; col++) {
    if (headers[col] && headers[col].toString().trim() !== '') {
      startCol = col;
      break;
    }
  }
  
  // 끝 열 찾기 (마지막 비어있지 않은 헤더)
  for (let col = headers.length - 1; col >= 0; col--) {
    if (headers[col] && headers[col].toString().trim() !== '') {
      endCol = col;
      break;
    }
  }
  
  // 마지막 데이터 행 찾기
  let endRow = headerRow;
  for (let row = headerRow + 1; row < data.length; row++) {
    let hasData = false;
    for (let col = startCol; col <= endCol; col++) {
      if (data[row][col] && data[row][col].toString().trim() !== '') {
        hasData = true;
        break;
      }
    }
    if (hasData) {
      endRow = row;
    }
  }
  
  return {
    startRow: headerRow,
    endRow,
    startCol,
    endCol
  };
};

// 열 인덱스를 엑셀 열 이름으로 변환 (0 -> A, 1 -> B, ...)
export const columnIndexToLetter = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

// XLSX 파일 처리 함수
export const processXLSXFile = async (file: File): Promise<{
  sheets: Array<{
    sheetName: string;
    headers: string[];
    data: string[][];
    metadata: {
      headerRow: number;
      dataRange: {
        startRow: number;
        endRow: number;
        startCol: number;
        endCol: number;
        startColLetter: string;
        endColLetter: string;
      };
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
        
        const sheets = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // 빈 셀을 빈 문자열로 처리
            raw: false // 값을 문자열로 변환
          }) as string[][];
          
          // 헤더 행 찾기
          const headerRow = findHeaderRow(rawData);
          
          // 데이터 범위 찾기
          const dataRange = findDataRange(rawData, headerRow);
          
          // 헤더 추출 (시작열부터 끝열까지)
          const headers = rawData[headerRow]
            ?.slice(dataRange.startCol, dataRange.endCol + 1)
            .map(header => header?.toString().trim() || '') || [];
          
          // 데이터 추출 (헤더 다음 행부터)
          const data = rawData
            .slice(headerRow + 1, dataRange.endRow + 1)
            .map(row => row.slice(dataRange.startCol, dataRange.endCol + 1)
              .map(cell => cell?.toString() || ''));
          
          return {
            sheetName,
            headers,
            data,
            metadata: {
              headerRow,
              dataRange: {
                ...dataRange,
                startColLetter: columnIndexToLetter(dataRange.startCol),
                endColLetter: columnIndexToLetter(dataRange.endCol)
              }
            }
          };
        });
        
        resolve({
          sheets,
          fileName: file.name
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
};