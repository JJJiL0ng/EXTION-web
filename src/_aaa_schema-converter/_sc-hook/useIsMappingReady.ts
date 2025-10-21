import { useMemo } from 'react';
import { useSourceSheetRangeStore } from "@/_aaa_schema-converter/_sc-store/sourceSheetRangeStore";
import { useTargetSheetRangeStore } from "@/_aaa_schema-converter/_sc-store/targetSheetRangeStore";

/**
 * 소스와 타겟 레인지가 모두 기본값이 아닌 경우 true를 반환
 * 기본값: [0, 0, 1, 1] (1행 × 1열)
 * 사용자가 영역을 선택하여 1행×1열보다 큰 영역을 선택한 경우에만 true
 */
export const useIsMappingReady = (): boolean => {
    const sourceRange = useSourceSheetRangeStore((state) => state.sourceRange);
    const targetRange = useTargetSheetRangeStore((state) => state.targetRange);

    const isMappingReady = useMemo(() => {
        // 기본값 체크: [0, 0, 1, 1]이 아닌 경우
        // rowCount > 1 또는 colCount > 1 인 경우 (즉, 1행×1열보다 큰 영역)
        const isSourceRangeSelected = sourceRange[2] > 1 || sourceRange[3] > 1;
        const isTargetRangeSelected = targetRange[2] > 1 || targetRange[3] > 1;

        return isSourceRangeSelected && isTargetRangeSelected;
    }, [sourceRange, targetRange]);

    return isMappingReady;
};
