import * as GC from "@mescius/spread-sheets";
import { ConvertedFileResult, FileConverterOptions, DEFAULT_CONVERTER_OPTIONS } from './types';

/**
 * CSV 파일을 SpreadJS 호환 JSON으로 변환
 */
export const convertCSVFile = async (
    fileData: any,
    fileName: string,
    options: FileConverterOptions = DEFAULT_CONVERTER_OPTIONS
): Promise<ConvertedFileResult> => {
    return new Promise((resolve, reject) => {
        // 임시 워크북 생성
        let tempWorkbook: any;
        try {
            tempWorkbook = new GC.Spread.Sheets.Workbook(document.createElement('div'));
            if (!tempWorkbook) {
                reject(new Error('임시 워크북 생성에 실패했습니다.'));
                return;
            }
        } catch (error) {
            reject(new Error(`임시 워크북 생성 실패: ${error}`));
            return;
        }

        const fileExtension = fileName.toLowerCase().split('.').pop();

        tempWorkbook.import(
            fileData,
            (result: any) => {
                try {
                    // SpreadJS JSON 형태로 변환
                    const jsonData = tempWorkbook.toJSON(options);

                    // 메타데이터 추가
                    const convertedResult: ConvertedFileResult = {
                        fileName: fileName,
                        originalType: 'csv',
                        spreadsheetData: jsonData,
                        timestamp: new Date().toISOString(),
                        fileExtension: fileExtension
                    };

                    // 임시 워크북 정리
                    tempWorkbook.destroy();
                    resolve(convertedResult);
                } catch (error) {
                    tempWorkbook.destroy();
                    reject(error);
                }
            },
            (error: any) => {
                tempWorkbook.destroy();
                reject(new Error(`CSV 파일 변환 실패: ${error.message || error}`));
            },
            {
                fileType: GC.Spread.Sheets.FileType.csv
            }
        );
    });
};