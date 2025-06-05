import * as XLSX from 'xlsx';
import { XLSXData, SheetData, ExtendedSheetContext, HeaderInfo, DataRange } from '../store-types';

// XLSX 파일을 파싱하는 헬퍼 함수
export const parseXLSXFile = async (file: File): Promise<XLSXData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheets: SheetData[] = workbook.SheetNames.map((sheetName: string, index: number) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

                    // 빈 배열 처리
                    if (jsonData.length === 0) {
                        return {
                            sheetName,
                            headers: [],
                            data: [],
                            metadata: {
                                rowCount: 0,
                                columnCount: 0,
                                headerRow: 0,
                                dataRange: {
                                    startRow: 0,
                                    endRow: 0,
                                    startCol: 0,
                                    endCol: 0,
                                    startColLetter: 'A',
                                    endColLetter: 'A'
                                }
                            }
                        };
                    }

                    const headers = jsonData[0] || [];
                    const data = jsonData.slice(1);

                    return {
                        sheetName,
                        headers,
                        data,
                        metadata: {
                            rowCount: data.length,
                            columnCount: headers.length,
                            headerRow: 0,
                            dataRange: {
                                startRow: 1,
                                endRow: data.length,
                                startCol: 0,
                                endCol: headers.length - 1,
                                startColLetter: 'A',
                                endColLetter: String.fromCharCode(65 + headers.length - 1)
                            },
                            lastModified: new Date()
                        }
                    };
                });

                resolve({
                    fileName: file.name,
                    sheets,
                    activeSheetIndex: 0
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(file);
    });
};

// 확장된 시트 컨텍스트 생성
export const generateExtendedSheetContext = (xlsxData: XLSXData, spreadsheetId?: string): ExtendedSheetContext => {
    const activeSheet = xlsxData.sheets[xlsxData.activeSheetIndex];

    if (!activeSheet) {
        throw new Error('활성 시트가 없습니다');
    }

    console.log('ExtendedSheetContext 생성 중:', {
        sheetName: activeSheet.sheetName,
        headersLength: activeSheet.headers?.length || 0,
        headers: activeSheet.headers,
        dataLength: activeSheet.data?.length || 0,
        rawDataLength: activeSheet.rawData?.length || 0,
        isFirebaseData: !!spreadsheetId
    });

    // Firebase 복원 데이터의 경우 헤더 처리
    let validHeaders: string[] = [];
    
    if (activeSheet.headers && activeSheet.headers.length > 0) {
        // 기존 헤더가 있는 경우
        validHeaders = activeSheet.headers.filter(h => h && h.trim() !== '');
    } else if (activeSheet.rawData && activeSheet.rawData.length > 0) {
        // rawData에서 첫 번째 행을 헤더로 사용
        const firstRow = activeSheet.rawData[0];
        if (firstRow && firstRow.length > 0) {
            validHeaders = firstRow.filter(h => h && h.trim() !== '');
            console.log('rawData에서 헤더 추출:', validHeaders);
        }
    } else if (activeSheet.data && activeSheet.data.length > 0) {
        // data가 있지만 헤더가 없는 경우 자동 생성
        const firstDataRow = activeSheet.data[0];
        if (firstDataRow && firstDataRow.length > 0) {
            validHeaders = firstDataRow.map((_, index) => `Column ${String.fromCharCode(65 + index)}`);
            console.log('자동 생성된 헤더:', validHeaders);
        }
    }

    // 여전히 헤더가 없는 경우 기본 헤더 생성
    if (validHeaders.length === 0) {
        validHeaders = ['Column A', 'Column B', 'Column C', 'Column D', 'Column E', 'Column F'];
        console.warn('기본 헤더 사용:', validHeaders);
    }

    const headers: HeaderInfo[] = validHeaders.map((header, index) => ({
        column: String.fromCharCode(65 + index),
        name: String(header)
    }));

    // 데이터 범위 계산
    const dataRowCount = activeSheet.data?.length || 0;
    const dataRange: DataRange = {
        startRow: '2',
        endRow: (dataRowCount + 1).toString(),
        startColumn: 'A',
        endColumn: String.fromCharCode(64 + validHeaders.length)
    };

    // 샘플 데이터 생성
    const sampleData = (activeSheet.data || []).slice(0, 3).map(row => {
        const rowData: Record<string, string> = {};
        validHeaders.forEach((header, index) => {
            rowData[String(header)] = String(row[index] || '');
        });
        return rowData;
    });

    const context = {
        sheetName: activeSheet.sheetName,
        sheetIndex: xlsxData.activeSheetIndex,
        headers,
        dataRange,
        sampleData,
        totalSheets: xlsxData.sheets.length,
        sheetList: xlsxData.sheets.map(sheet => sheet.sheetName),
        spreadsheetId: spreadsheetId
    };

    console.log('ExtendedSheetContext 생성 완료:', {
        sheetName: context.sheetName,
        headersCount: context.headers.length,
        headerNames: context.headers.map(h => h.name),
        sampleDataCount: context.sampleData?.length || 0
    });

    return context;
};

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