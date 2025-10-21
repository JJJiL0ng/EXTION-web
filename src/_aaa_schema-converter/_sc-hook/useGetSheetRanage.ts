import { useState, useEffect, useCallback } from 'react';
import GC from '@mescius/spread-sheets';

import { useSourceSheetRangeStore } from "@/_aaa_schema-converter/_sc-store/sourceSheetRangeStore";
import { useTargetSheetRangeStore } from "@/_aaa_schema-converter/_sc-store/targetSheetRangeStore";


export interface RangeSelectorProps {
    spreadRef: React.MutableRefObject<any>; // SpreadJS ref
    viewerType: 'source' | 'target';
}

export const useGetSheetRange = ({ spreadRef, viewerType }: RangeSelectorProps): [number, number, number, number] => {
    const [range, setRange] = useState<[number, number, number, number]>([0, 0, 1, 1]);

    // viewer 타입에 따라 적절한 스토어 가져오기
    const setSourceRange = useSourceSheetRangeStore((state) => state.setSourceRange);
    const setTargetRange = useTargetSheetRangeStore((state) => state.setTargetRange);

    // useCallback을 사용하여 안정적인 함수 참조 유지
    const updateRange = useCallback(() => {
        const spread = spreadRef.current;
        if (!spread) {
            console.log('useGetSheetRange: spread is null');
            return;
        }

        try {
            const sheet = spread.getActiveSheet();
            if (!sheet) {
                // console.log('useGetSheetRange: sheet is null');
                return;
            }

            const selections = sheet.getSelections();
            // console.log('useGetSheetRange: selections', selections);

            if (selections && selections.length > 0) {
                const selection = selections[0];
                const rangeArray: [number, number, number, number] = [
                    selection.row,
                    selection.col,
                    selection.rowCount,
                    selection.colCount
                ];
                // console.log('useGetSheetRange: Setting range to', rangeArray);
                setRange(rangeArray);

                // viewer 타입에 따라 적절한 스토어에 업데이트
                if (viewerType === 'source') {
                    setSourceRange(rangeArray);
                } else if (viewerType === 'target') {
                    setTargetRange(rangeArray);
                }
            }
        } catch (error) {
            console.error('useGetSheetRange: Error in updateRange', error);
        }
    }, [spreadRef, viewerType, setSourceRange, setTargetRange]);

    useEffect(() => {
        const spread = spreadRef.current;
        if (!spread) {
            console.log('useGetSheetRange: Effect - spread is null, skipping');
            return;
        }

        // console.log('useGetSheetRange: Effect - Binding event listener');

        // 선택 변경 이벤트 리스너 추가
        spread.bind(GC.Spread.Sheets.Events.SelectionChanged, updateRange);

        // 초기 범위 설정
        updateRange();

        // 클린업
        return () => {
            // console.log('useGetSheetRange: Effect - Unbinding event listener');
            if (spread && spread.unbind) {
                spread.unbind(GC.Spread.Sheets.Events.SelectionChanged, updateRange);
            }
        };
    }, [spreadRef, updateRange]);
    return range;
}
