import { ConvertedFileResult, FileConverterOptions, DEFAULT_CONVERTER_OPTIONS } from './types';
import { convertExcelFile } from './excelConverter';
import { convertCSVFile } from './csvConverter';
import { convertJSONFile, convertSJSFile, convertTextFile } from './jsonConverter';

/**
 * 파일 데이터를 SpreadJS 호환 JSON으로 변환하는 통합 인터페이스
 */
export class FileConverter {
    /**
     * 파일 데이터를 JSON으로 변환
     * @param fileData 변환할 파일 데이터
     * @param fileName 파일명 (확장자 포함)
     * @param options 변환 옵션
     * @returns 변환된 파일 결과
     */
    static async convertToJson(
        fileData: any,
        fileName: string,
        options: FileConverterOptions = DEFAULT_CONVERTER_OPTIONS
    ): Promise<ConvertedFileResult> {
        try {
            // 이미 JSON 객체인 경우 그대로 반환 (Blob이나 File 객체가 아닌 경우)
            if (typeof fileData === 'object' && fileData !== null &&
                !(fileData instanceof Blob) && !(fileData instanceof File)) {
                return {
                    fileName: fileName,
                    originalType: 'object',
                    spreadsheetData: fileData,
                    timestamp: new Date().toISOString()
                };
            }

            // 파일 확장자 확인
            const fileExtension = fileName.toLowerCase().split('.').pop();

            // 파일 타입별 변환
            switch (fileExtension) {
                case 'xlsx':
                case 'xls':
                    return await convertExcelFile(fileData, fileName, options);
                    
                case 'csv':
                    return await convertCSVFile(fileData, fileName, options);
                    
                case 'json':
                    return await convertJSONFile(fileData, fileName);
                    
                case 'sjs':
                    return await convertSJSFile(fileData, fileName);
                    
                default:
                    // 문자열이나 기타 타입 처리
                    return await convertTextFile(fileData, fileName);
            }

        } catch (error) {
            console.warn('파일 데이터 JSON 변환 실패:', error);
            // 변환 실패 시 기본 구조 반환
            return {
                fileName: fileName,
                originalType: 'unknown',
                error: `Failed to convert file data: ${error instanceof Error ? error.message : error}`,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 개별 변환기들도 export
export { convertExcelFile } from './excelConverter';
export { convertCSVFile } from './csvConverter';
export { convertJSONFile, convertSJSFile, convertTextFile } from './jsonConverter';
export * from './types';