import * as GC from "@mescius/spread-sheets";

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
export const configureLicense = () => {
    // const SpreadJSKey = "extion.ai|www.extion.ai,994437339345835#B14QusSMWhke8lnc4pUc8EXSwo7dVZTdiBzLYN6U5dHN6Q4bVhmTjRWRYJGauVkawIFdNl7b7V6YzoGWkRjUM9mTxEUe4J6UE3ENLtyK6U6Twg6V6ZkVoFnMRZDULh7UVpHcyBlTJd4S9s6dvMTSnJ7LalkRJJ5TUhzcE3EcHdDRwQDe6dHTxEGeycDMsJEbiFFV92SOXJGZ5llMwg7M9VzMsJGSrEkds36R7h5dnJGTtxGZ69EcpFFcvcHe0JVU52me9gzZ5J4KaFmZVRlQStUciNlRwYmQZt6VWdDWuFFVklzVtdFdxRzNqV6UZJVb83UeZdkI0IyUiwiI6EDMCBTNFdjI0ICSiwyM4UTN7YDO4kTM0IicfJye#4Xfd5nIIlkSCJiOiMkIsICOx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiYjM6UDNwACMygDM5IDMyIiOiQncDJCLikWYu86bpRHel9yd7dHLpFmLu3Wa4hXZiojIz5GRiwiIkqI1cSI1sa00wyY1iojIh94QiwiI5MDO5QzM9MzM7MDN4kTOiojIklkIs4XXbpjInxmZiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdIlDas9GerImVuF7alljavpFOKVlbSNVOJtWcsdjN4cFNWplZ6FTUrEzcsNFW5EEc8M7UGREaDFHULp7L9JHZnpGU9p4dVVHO8FTSNFGa8VzROVURx5GR4EESHlTNjRWULt";
    // GC.Spread.Sheets.LicenseKey = SpreadJSKey;
    // GC.Spread.Common.CultureManager.culture("ko-kr");
};