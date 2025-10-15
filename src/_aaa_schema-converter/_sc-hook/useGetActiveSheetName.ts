import { useState, useEffect, useCallback, useRef } from 'react';
import GC from '@mescius/spread-sheets';

import { useSourceSheetNameStore } from "../_sc-store/sourceSheetNameStore";
import { useTargetSheetNameStore } from "../_sc-store/targetSheetNameStore";

export interface useGetActiveSheetNameProps {
    viewerType: 'source' | 'target';
    spread: any;
}

export const useGetActiveSheetName = ({ viewerType, spread }: useGetActiveSheetNameProps): string => {
    const [activeSheetName, setActiveSheetName] = useState<string>('');
    const prevSpreadRef = useRef<any>(null);
    
    // viewer 타입에 따라 적절한 스토어 가져오기
    const setSourceSheetName = useSourceSheetNameStore((state) => state.setSourceSheetName);
    const setTargetSheetName = useTargetSheetNameStore((state) => state.setTargetSheetName);

    const updateActiveSheetName = useCallback(() => {
        if (!spread) {
            console.log('useGetActiveSheetName: spread is null');
            return;
        }

        try {
            const sheet = spread.getActiveSheet();
            if (!sheet) {
                console.log('useGetActiveSheetName: sheet is null');
                return;
            }

            const sheetName = sheet.name();
            if (!sheetName) {
                console.log('useGetActiveSheetName: sheet name is null');
                return;
            }

            console.log('useGetActiveSheetName: Setting sheet name to', sheetName);
            setActiveSheetName(sheetName);
            
            // viewer 타입에 따라 적절한 스토어에 업데이트
            if (viewerType === 'source') {
                setSourceSheetName(sheetName);
            } else if (viewerType === 'target') {
                setTargetSheetName(sheetName);
            }
        } catch (error) {
            console.error('useGetActiveSheetName: Error in updateActiveSheetName', error);
        }
    }, [spread, viewerType, setSourceSheetName, setTargetSheetName]);

    useEffect(() => {
        if (!spread) {
            console.log('useGetActiveSheetName: Effect - spread is null, skipping');
            return;
        }

        console.log('useGetActiveSheetName: Effect - Setting up event listener');

        // 이전 spread에서 이벤트 리스너 제거
        if (prevSpreadRef.current && prevSpreadRef.current !== spread) {
            console.log('useGetActiveSheetName: Unbinding from previous spread');
            try {
                prevSpreadRef.current.unbind(GC.Spread.Sheets.Events.ActiveSheetChanged, updateActiveSheetName);
            } catch (error) {
                console.error('useGetActiveSheetName: Error unbinding from previous spread', error);
            }
        }

        // 현재 spread 저장
        prevSpreadRef.current = spread;

        // 시트 변경 이벤트 리스너 추가
        spread.bind(GC.Spread.Sheets.Events.ActiveSheetChanged, updateActiveSheetName);
        
        // 초기 시트 이름 설정 (약간의 지연을 주어 spread가 완전히 초기화되도록 함)
        setTimeout(() => {
            updateActiveSheetName();
        }, 100);

        // 클린업
        return () => {
            console.log('useGetActiveSheetName: Effect cleanup - Unbinding event listener');
            if (spread) {
                try {
                    spread.unbind(GC.Spread.Sheets.Events.ActiveSheetChanged, updateActiveSheetName);
                } catch (error) {
                    console.error('useGetActiveSheetName: Error in cleanup', error);
                }
            }
        };
    }, [spread, updateActiveSheetName]);

    return activeSheetName;
}