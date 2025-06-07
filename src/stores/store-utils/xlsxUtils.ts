import * as XLSX from 'xlsx';

// 시트 참조 문자열 생성 (예: Sheet1!A1)
export const coordsToSheetReference = (
    sheetIndex: number,
    row: number,
    col: number,
    sheetNames: string[]
): string => {
    const sheetName = sheetNames[sheetIndex] || `Sheet${sheetIndex + 1}`;
    const colLetter = String.fromCharCode(65 + col);
    const rowNumber = row + 1;
    return `${sheetName}!${colLetter}${rowNumber}`;
};

// 셀 주소를 좌표로 변환하는 독립적인 유틸리티 함수
export const cellAddressToCoords = (cellAddress: string) => {
    console.log('🔍 cellAddressToCoords 입력:', cellAddress);
    
    const match = cellAddress.match(/([A-Z]+)([0-9]+)/);
    if (!match) {
        const error = `유효하지 않은 셀 주소: ${cellAddress}`;
        console.error('❌ 셀 주소 파싱 실패:', error);
        throw new Error(error);
    }

    const [, colStr, rowStr] = match;
    console.log('🔍 파싱된 부분:', { colStr, rowStr });
    
    // 열 주소를 숫자로 변환 (A=0, B=1, ..., Z=25, AA=26, AB=27, ...)
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
    }
    col -= 1; // 0-based 인덱스로 변환
    
    // 행 주소를 숫자로 변환 (1-based to 0-based)
    const row = parseInt(rowStr) - 1;
    
    const result = { row, col };
    console.log('✅ 변환 결과:', result);
    
    // 역변환으로 검증
    const colLetter = String.fromCharCode(65 + col);
    const cellAddressCheck = `${colLetter}${row + 1}`;
    console.log('🔄 역변환 검증:', { 
        original: cellAddress, 
        reconstructed: cellAddressCheck,
        matches: cellAddress === cellAddressCheck 
    });
    
    return result;
}; 