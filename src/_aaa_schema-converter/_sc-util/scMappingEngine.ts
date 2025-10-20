import { ScMappingScriptResDto } from "../_sc-type/scMappingScript.types";

export interface ScMappingEngineProps {
    ScMappingScriptResDto: ScMappingScriptResDto;
    sourceSpread: any; // SpreadJS Workbook instance
    targetSpread: any; // SpreadJS Workbook instance
}

export const ScMappingEngine = ({ 
    ScMappingScriptResDto, 
    sourceSpread, 
    targetSpread 
}: ScMappingEngineProps) => {
    try {
        // Spread 인스턴스 검증
        if (!sourceSpread || !targetSpread) {
            console.error('Spreadsheet instances are not provided');
            return { success: false, error: 'Spreadsheet instances are not provided' };
        }
        // 매핑 스크립트가 없거나 성공하지 않은 경우
        if (!ScMappingScriptResDto.success || !ScMappingScriptResDto.mappingScript) {
            console.error('Invalid mapping script');
            return { success: false, error: 'Invalid mapping script' };
        }

        const { mappingScript } = ScMappingScriptResDto;
        const { s: source_sheet, t: target_sheet, m: mappings } = mappingScript;

        // SpreadJS 워크북 가져오기 (context에서 직접 사용)
        const sourceWorkbook = sourceSpread;
        const targetWorkbook = targetSpread;

        if (!sourceWorkbook || !targetWorkbook) {
            console.error('Workbook reference is null');
            return { success: false, error: 'Workbook reference is null' };
        }

        // 시트 가져오기
        const sourceSheet = sourceWorkbook.getSheetFromName(source_sheet);
        const targetSheet = targetWorkbook.getSheetFromName(target_sheet);

        if (!sourceSheet) {
            console.error(`Source sheet "${source_sheet}" not found`);
            return { success: false, error: `Source sheet "${source_sheet}" not found` };
        }

        if (!targetSheet) {
            console.error(`Target sheet "${target_sheet}" not found`);
            return { success: false, error: `Target sheet "${target_sheet}" not found` };
        }

        // 배치 업데이트를 위한 suspend
        targetWorkbook.suspendPaint();
        targetSheet.suspendCalcService();

        let successCount = 0;
        let errorCount = 0;

        // 매핑 적용
        mappings.forEach((mapping, index) => {
            try {
                // 배열 형식: [source_row, source_col, target_row, target_col]
                const [source_row, source_col, target_row, target_col] = mapping;

                // 1. 소스 셀에서 '최종 값'을 가져옵니다.
                // (수식이면 계산된 값, 아니면 그냥 값)
                let sourceValue = sourceSheet.getValue(source_row, source_col);
                
                // 2. null 값 방어
                if (sourceValue === null) {
                    sourceValue = "";
                }

                console.log(
                    `Mapping [${source_row}, ${source_col}] -> [${target_row}, ${target_col}]`, 
                    "Source Value:", 
                    sourceValue
                );
                
                // 3. 타겟 셀의 기존 수식을 먼저 제거합니다.
                targetSheet.setFormula(target_row, target_col, null);
                
                // 4. 타겟 셀에 그 '최종 값'을 설정합니다.
                targetSheet.setValue(target_row, target_col, sourceValue);

                // 5. 스타일 복사 (수식 제외)
                // setStyle 대신 개별 스타일 속성을 직접 설정
                const sourceStyle = sourceSheet.getStyle(source_row, source_col);
                if (sourceStyle) {
                    try {
                        // 폰트
                        if (sourceStyle.font) {
                            targetSheet.getCell(target_row, target_col).font(sourceStyle.font);
                        }
                        // 전경색
                        if (sourceStyle.foreColor) {
                            targetSheet.getCell(target_row, target_col).foreColor(sourceStyle.foreColor);
                        }
                        // 배경색
                        if (sourceStyle.backColor) {
                            targetSheet.getCell(target_row, target_col).backColor(sourceStyle.backColor);
                        }
                        // 수평 정렬
                        if (sourceStyle.hAlign !== undefined) {
                            targetSheet.getCell(target_row, target_col).hAlign(sourceStyle.hAlign);
                        }
                        // 수직 정렬
                        if (sourceStyle.vAlign !== undefined) {
                            targetSheet.getCell(target_row, target_col).vAlign(sourceStyle.vAlign);
                        }
                        // 테두리
                        if (sourceStyle.borderLeft) {
                            targetSheet.getCell(target_row, target_col).borderLeft(sourceStyle.borderLeft);
                        }
                        if (sourceStyle.borderTop) {
                            targetSheet.getCell(target_row, target_col).borderTop(sourceStyle.borderTop);
                        }
                        if (sourceStyle.borderRight) {
                            targetSheet.getCell(target_row, target_col).borderRight(sourceStyle.borderRight);
                        }
                        if (sourceStyle.borderBottom) {
                            targetSheet.getCell(target_row, target_col).borderBottom(sourceStyle.borderBottom);
                        }
                        // 포맷터
                        if (sourceStyle.formatter) {
                            targetSheet.getCell(target_row, target_col).formatter(sourceStyle.formatter);
                        }
                        // 워드랩
                        if (sourceStyle.wordWrap !== undefined) {
                            targetSheet.getCell(target_row, target_col).wordWrap(sourceStyle.wordWrap);
                        }
                    } catch (styleError) {
                        console.warn(`Failed to copy style for cell [${target_row}, ${target_col}]:`, styleError);
                    }
                }

                successCount++;
            } catch (error) {
                console.error(`Error mapping item ${index}:`, mapping, error);
                errorCount++;
            }
        });

        // 배치 업데이트 재개
        targetSheet.resumeCalcService();
        targetWorkbook.resumePaint();

        console.log(`Mapping completed: ${successCount} success, ${errorCount} errors`);

        return {
            success: true,
            totalMappings: mappings.length,
            successCount,
            errorCount
        };

    } catch (error) {
        console.error('Error in ScMappingEngine:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
