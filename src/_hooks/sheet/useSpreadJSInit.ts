import { useCallback, MutableRefObject } from 'react';
import { configurePerformanceSettings, setupDefaultData, setupDefaultStyles } from '../../_utils/sheet/spreadJSConfig';

interface UseSpreadJSInitProps {
    spreadRef: MutableRefObject<any>;
    deltaManager?: any;
}

/**
 * SpreadJS 초기화 및 설정을 담당하는 훅
 */
export const useSpreadJSInit = ({ spreadRef, deltaManager }: UseSpreadJSInitProps) => {
    
    /**
     * SpreadJS 인스턴스 초기화
     */
    const initSpread = useCallback((spread: any) => {
        try {
            // SpreadJS 인스턴스 유효성 검사
            if (!spread) {
                console.error('❌ SpreadJS 인스턴스가 null 또는 undefined입니다.');
                return;
            }

            // SpreadJS 인스턴스 저장
            spreadRef.current = spread;

            // 성능 최적화 설정
            configurePerformanceSettings(spread);

            // 기본 시트 설정 - 성능 최적화된 크기
            const sheet = spread.getActiveSheet();
            if (!sheet) {
                console.error('❌ 활성 시트를 가져올 수 없습니다.');
                return;
            }

            sheet.setRowCount(500);  // 기본 500행
            sheet.setColumnCount(50); // 기본 50열

            // 가상화 및 성능 설정 - null 체크 추가
            if (sheet.suspendPaint && typeof sheet.suspendPaint === 'function') {
                sheet.suspendPaint();
            }

            try {
                // 기본 데이터 및 스타일 설정
                setupDefaultData(sheet);
                setupDefaultStyles(sheet);
            } finally {
                // resumePaint도 null 체크
                if (sheet.resumePaint && typeof sheet.resumePaint === 'function') {
                    sheet.resumePaint();
                }
            }

            // 델타 자동저장을 위한 이벤트 리스너 설정 (선택적)
            if (deltaManager?.setupEventListeners) {
                const cleanupDeltaListeners = deltaManager.setupEventListeners(spread);
                // 정리 함수를 나중에 사용하기 위해 저장
                (spread as any)._deltaCleanup = cleanupDeltaListeners;
            }

            console.log('✅ SpreadJS 초기화 완료 - 최적화된 설정 적용');

        } catch (error) {
            console.error('❌ SpreadJS 초기화 실패:', error);
            // 에러 발생 시에도 기본 인스턴스는 저장
            if (spread) {
                spreadRef.current = spread;
            }
        }
    }, [spreadRef, deltaManager]);

    /**
     * 새로운 스프레드시트 생성
     */
    const createNewSpreadsheet = useCallback(() => {
        if (!spreadRef.current) {
            console.error('SpreadJS 인스턴스가 초기화되지 않았습니다.');
            return false;
        }

        try {
            // SpreadJS 인스턴스 유효성 재확인
            if (!spreadRef.current.clearSheets || typeof spreadRef.current.clearSheets !== 'function') {
                console.error('SpreadJS 인스턴스가 올바르지 않습니다.');
                return false;
            }

            spreadRef.current.clearSheets();
            spreadRef.current.addSheet(0);
            const sheet = spreadRef.current.getActiveSheet();

            if (!sheet) {
                console.error('새 시트 생성에 실패했습니다.');
                return false;
            }

            sheet.name("Sheet1");

            // 새 시트에 최적화 설정 적용
            configurePerformanceSettings(spreadRef.current);

            console.log('✅ 새 스프레드시트 생성 완료');
            return true;

        } catch (error) {
            console.error('❌ 새 스프레드시트 생성 실패:', error);
            return false;
        }
    }, [spreadRef]);

    return {
        initSpread,
        createNewSpreadsheet
    };
};