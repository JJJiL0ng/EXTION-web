import { ConvertedFileResult } from './types';

/**
 * JSON 파일을 처리
 */
export const convertJSONFile = async (
    fileData: any,
    fileName: string
): Promise<ConvertedFileResult> => {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    
    if (typeof fileData === 'string') {
        try {
            const parsedJson = JSON.parse(fileData);
            return {
                fileName: fileName,
                originalType: 'json',
                spreadsheetData: parsedJson,
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };
        } catch {
            return {
                fileName: fileName,
                originalType: 'json',
                content: fileData,
                error: 'JSON 파싱 실패',
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };
        }
    }
    
    // 이미 파싱된 객체인 경우
    return {
        fileName: fileName,
        originalType: 'json',
        spreadsheetData: fileData,
        timestamp: new Date().toISOString(),
        fileExtension: fileExtension
    };
};

/**
 * SJS (SpreadJS 네이티브) 파일을 처리
 */
export const convertSJSFile = async (
    fileData: any,
    fileName: string
): Promise<ConvertedFileResult> => {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    
    if (typeof fileData === 'string') {
        try {
            const parsedSjs = JSON.parse(fileData);
            return {
                fileName: fileName,
                originalType: 'sjs',
                spreadsheetData: parsedSjs,
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };
        } catch {
            return {
                fileName: fileName,
                originalType: 'sjs',
                content: fileData,
                error: 'SJS 파싱 실패',
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };
        }
    }
    
    // 이미 파싱된 객체인 경우
    return {
        fileName: fileName,
        originalType: 'sjs',
        spreadsheetData: fileData,
        timestamp: new Date().toISOString(),
        fileExtension: fileExtension
    };
};

/**
 * 일반 텍스트 파일을 처리
 */
export const convertTextFile = async (
    fileData: any,
    fileName: string
): Promise<ConvertedFileResult> => {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    
    if (typeof fileData === 'string') {
        try {
            const parsedData = JSON.parse(fileData);
            return {
                fileName: fileName,
                originalType: 'text',
                spreadsheetData: parsedData,
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };
        } catch {
            // JSON 파싱 실패 시 문자열을 객체로 감싸서 반환
            return {
                fileName: fileName,
                originalType: 'text',
                content: fileData,
                timestamp: new Date().toISOString(),
                fileExtension: fileExtension
            };
        }
    }
    
    // 기타 타입의 경우 기본 구조로 감싸서 반환
    return {
        fileName: fileName,
        originalType: typeof fileData,
        data: fileData,
        timestamp: new Date().toISOString(),
        fileExtension: fileExtension
    };
};