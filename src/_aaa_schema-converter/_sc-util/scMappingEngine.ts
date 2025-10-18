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
        const { source_sheet, target_sheet, mappings } = mappingScript;

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
                const { source_row, source_col, target_row, target_col } = mapping;

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
                
                // 3. 타겟 셀에 그 '최종 값'을 설정합니다.
                targetSheet.setValue(target_row, target_col, sourceValue);

                // 4. 스타일 복사 (❗️ 수정된 부분 ❗️)
                const sourceStyle = sourceSheet.getStyle(source_row, source_col);
                if (sourceStyle) {
                    // 1. 원본 스타일 객체를 '복사'하여 새 객체를 만듭니다.
                    //    (원본을 직접 수정하지 않습니다.)
                    const styleToApply = { ...sourceStyle };

                    // 2. '복사본'의 formula 속성을 확실하게 제거합니다.
                    styleToApply.formula = null;

                    // 3. 수식이 제거된 '복사본'을 타겟에 적용합니다.
                    targetSheet.setStyle(target_row, target_col, styleToApply);
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
