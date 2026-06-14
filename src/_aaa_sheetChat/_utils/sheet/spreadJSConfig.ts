import { configureSpreadRuntime, GC } from '@/shared/spreadjs/spreadRuntime';

/**
 * SpreadJS 성능 최적화 설정
 */
export const configurePerformanceSettings = (spread: any) => {
    try {
        const options = spread.options;
        options.calcOnDemand = true;
        options.allowUserResize = true;
        options.allowUserDragDrop = false;
        options.allowUserDragFill = true;
        options.scrollIgnoreHidden = true;
        options.scrollByPixel = false;
        options.referenceStyle = GC.Spread.Sheets.ReferenceStyle.a1;

        spread.getHost().style.overflow = 'auto';
        spread.getHost().style.rowHeaderVisible = true;
        spread.getHost().style.colHeaderVisible = true;

        console.log('🔧 성능 최적화 설정 완료');
    } catch (error) {
        console.warn('⚠️ 성능 설정 경고:', error);
    }
};

/**
 * 기본 시트 데이터 설정
 */
export const setupDefaultData = (sheet: any) => {
    sheet.setValue(1, 1, "");
};

/**
 * 기본 스타일 설정
 */
export const setupDefaultStyles = (sheet: any) => {
    // sheet.setColumnWidth(1, 200);
    // sheet.setColumnWidth(2, 200);
};

/**
 * SpreadJS 라이선스 설정
 */
export const configureLicense = configureSpreadRuntime;
