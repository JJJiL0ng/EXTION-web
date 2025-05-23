import * as XLSX from 'xlsx';

/**
 * 단일 시트를 CSV 파일로 내보내는 함수
 * @param sheetData 내보낼 시트의 데이터 (헤더 및 행 포함)
 * @param fileName 저장될 파일명
 */
export const exportSheetToCSV = (
  sheetData: { headers: string[], data: string[][] },
  fileName: string = 'export.csv'
): void => {
  try {
    // 헤더와 데이터를 합쳐서 전체 데이터 생성
    const csvContent = [
      sheetData.headers,
      ...sheetData.data
    ].map(row => 
      // 각 셀이 쉼표나 따옴표를 포함하는 경우 처리
      row.map(cell => {
        // null이나 undefined 처리
        if (cell === null || cell === undefined) return '';
        
        const cellStr = String(cell);
        // 쉼표, 줄바꿈, 큰따옴표가 포함된 경우 큰따옴표로 감싸고 내부 따옴표는 두 번 사용
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    // BOM(Byte Order Mark) 추가 - UTF-8로 한글 인코딩 해결
    const BOM = '\uFEFF';
    const csvContentWithBOM = BOM + csvContent;
    
    // Blob 생성
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
    
    // 링크 생성 및 클릭하여 파일 다운로드
    const link = document.createElement('a');
    
    // 파일명 확장자 확인
    const sanitizedFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    
    // 다운로드 링크 설정
    link.href = URL.createObjectURL(blob);
    link.download = sanitizedFileName;
    link.style.display = 'none';
    
    // 링크 클릭 이벤트 트리거
    document.body.appendChild(link);
    link.click();
    
    // 정리
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 100);
  } catch (error) {
    console.error('CSV 내보내기 오류:', error);
    throw new Error('CSV 파일로 내보내는 중 오류가 발생했습니다.');
  }
};

/**
 * 복수의 시트를 포함한 XLSX 파일 내보내기 함수
 * @param sheetsData 내보낼 시트 데이터 배열
 * @param fileName 저장될 파일명
 */
export const exportToXLSX = (
  sheetsData: Array<{
    sheetName: string;
    headers: string[];
    data: string[][];
  }>,
  fileName: string = 'export.xlsx'
): void => {
  try {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 시트 데이터 반복 처리
    sheetsData.forEach((sheet) => {
      // 헤더와 데이터를 합쳐서 전체 데이터 생성
      const sheetData = [
        sheet.headers,
        ...sheet.data
      ];
      
      // 워크시트 생성
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // 워크북에 워크시트 추가 - 한글 시트명 처리
      const safeSheetName = sheet.sheetName.replace(/[[\]*/\\?:]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });
    
    // 파일명 확장자 확인
    const sanitizedFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    
    // XLSX 파일로 내보내기 (한글 지원 옵션 추가)
    const writeOptions = {
      bookType: 'xlsx' as const,
      type: 'binary' as const,
      bookSST: false,
      compression: true
    };
    
    XLSX.writeFile(workbook, sanitizedFileName, writeOptions);
  } catch (error) {
    console.error('XLSX 내보내기 오류:', error);
    throw new Error('XLSX 파일로 내보내는 중 오류가 발생했습니다.');
  }
};

/**
 * 현재 선택된 시트의 데이터를 CSV로 내보내는 간편 함수
 * @param activeSheetData 현재 활성화된 시트 데이터
 * @param fileName 저장될 파일명 (기본값: activeSheet.csv)
 */
export const exportActiveSheetToCSV = (
  activeSheetData: {
    sheetName: string;
    headers: string[];
    data: string[][];
  },
  fileName?: string
): void => {
  const exportFileName = fileName || `${activeSheetData.sheetName}.csv`;
  exportSheetToCSV(
    { headers: activeSheetData.headers, data: activeSheetData.data },
    exportFileName
  );
};

/**
 * 선택된 시트들의 데이터를 XLSX로 내보내는 간편 함수
 * @param xlsxData XLSX 전체 데이터
 * @param selectedSheetIndices 선택된 시트 인덱스 (없으면 모든 시트 내보내기)
 * @param fileName 저장될 파일명 (기본값: 원본 파일명)
 */
export const exportSelectedSheetsToXLSX = (
  xlsxData: {
    fileName: string;
    sheets: Array<{
      sheetName: string;
      headers: string[];
      data: string[][];
    }>;
  },
  selectedSheetIndices?: number[],
  fileName?: string
): void => {
  // 내보낼 시트 결정
  const sheetsToExport = selectedSheetIndices 
    ? selectedSheetIndices.map(index => xlsxData.sheets[index]).filter(Boolean)
    : xlsxData.sheets;
  
  // 기본 파일명 설정
  const exportFileName = fileName || xlsxData.fileName;
  
  // XLSX로 내보내기
  exportToXLSX(sheetsToExport, exportFileName);
}; 