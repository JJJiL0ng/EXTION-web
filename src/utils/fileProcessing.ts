// utils/fileProcessing.ts - 헤더 감지 약화 및 원본 구조 완전 보존 버전
import * as XLSX from 'xlsx';

// ============================================================================
// 상태 관리 인터페이스 확장 (기존 코드와 호환성 유지)
// ============================================================================

// 기존 SheetData 인터페이스 확장
export interface ExtendedSheetData {
  sheetName: string;
  rawData: string[][]; // 완전한 원본 데이터
  
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
  };
}

// ============================================================================
// 핵심 유틸리티 함수들
// ============================================================================

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
// 파일 처리 메인 함수들
// ============================================================================

// XLSX 파일 처리 함수 - 원본 구조 완전 보존
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
          cellFormula: true,
          cellStyles: true,
          cellDates: true,
          sheetStubs: true,
          raw: false
        });
        
        const processedSheets: ExtendedSheetData[] = workbook.SheetNames.map(sheetName => {
          console.log(`Processing sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const endRow = range.e.r;
          const endCol = range.e.c;

          const rawData: string[][] = [];
          for (let R = 0; R <= endRow; ++R) {
              const row: string[] = [];
              for (let C = 0; C <= endCol; ++C) {
                  const cellAddress = { c: C, r: R };
                  const cellRef = XLSX.utils.encode_cell(cellAddress);
                  const cell = worksheet[cellRef];
                  const cellValue = cell ? (cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : '')) : '';
                  row.push(String(cellValue || ''));
              }
              rawData.push(row);
          }
          
          console.log(`Full raw data dimensions for ${sheetName}: ${rawData.length} rows, range: ${worksheet['!ref']}`);
          
          const rowCount = rawData.length;
          const columnCount = rowCount > 0 ? rawData[0].length : 0;

          const result: ExtendedSheetData = {
            sheetName,
            rawData,
            dataBounds: {
              minRow: 0,
              maxRow: rowCount > 0 ? rowCount - 1 : 0,
              minCol: 0,
              maxCol: columnCount > 0 ? columnCount - 1 : 0,
              actualStartRow: 0,
              actualStartCol: 0
            },
            metadata: {
              rowCount: rowCount,
              columnCount: columnCount,
              dataRange: {
                startRow: 0,
                endRow: rowCount > 0 ? rowCount - 1 : 0,
                startCol: 0,
                endCol: columnCount > 0 ? columnCount - 1 : 0,
                startColLetter: 'A',
                endColLetter: columnIndexToLetter(columnCount > 0 ? columnCount - 1 : 0),
              },
              preserveOriginalStructure: true,
              lastModified: new Date(),
            }
          };
          
          return result;
        });
        
        // 완전히 빈 시트를 제외하고 반환
        const nonEmptySheets = processedSheets.filter(sheet => 
          sheet.rawData.length > 1 || // 여러 행이 있거나
          (sheet.rawData.length === 1 && sheet.rawData[0].length > 0 && sheet.rawData[0].some(cell => cell !== '')) // 데이터가 있는 경우
        );
        
        console.log(`Successfully processed ${nonEmptySheets.length} non-empty sheets from ${file.name}`);
        
        resolve({
          sheets: nonEmptySheets.length > 0 ? nonEmptySheets : processedSheets, // 모든 시트가 비어있어도 최소 1개는 반환
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

// 디버깅을 위한 시트 정보 출력
export const debugSheetInfo = (sheetData: ExtendedSheetData): void => {
  console.group(`📊 Sheet Debug Info: ${sheetData.sheetName}`);
  console.log('📐 Raw Data Dimensions:', `${sheetData.rawData.length} rows × ${sheetData.rawData[0]?.length || 0} cols`);
  console.log('📊 Data Bounds:', sheetData.dataBounds);
  
  // 샘플 데이터 출력 (처음 3행)
  if (sheetData.rawData.length > 0) {
    console.log('📝 Sample Data:');
    console.table(sheetData.rawData.slice(0, 3));
  }
  
  console.groupEnd();
};

