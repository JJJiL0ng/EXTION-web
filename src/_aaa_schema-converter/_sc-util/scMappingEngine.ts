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

                // 소스 셀에서 데이터 가져오기
                const sourceValue = sourceSheet.getValue(source_row, source_col);
                const sourceFormula = sourceSheet.getFormula(source_row, source_col);
                const sourceStyle = sourceSheet.getStyle(source_row, source_col);

                // 타겟 셀에 데이터 설정
                // 수식이 있으면 수식을, 없으면 값을 설정
                if (sourceFormula) {
                    targetSheet.setFormula(target_row, target_col, sourceFormula);
                } else {
                    targetSheet.setValue(target_row, target_col, sourceValue);
                }

                // 스타일 복사 (옵션)
                if (sourceStyle) {
                    targetSheet.setStyle(target_row, target_col, sourceStyle);
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
