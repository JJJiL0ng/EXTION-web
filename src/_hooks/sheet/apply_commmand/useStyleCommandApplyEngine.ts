// import GC from '@mescius/spread-sheets';
// import { StyleCommand, StyleProperties, BorderInfo } from "@/_types/ai-chat-api/style.types";

// interface StyleCommandApplyEngineProps {
//     sheetIndex: number;
//     range: number[];
//     styleCommand: StyleCommand;
//     spread: any;
// }


// const useStyleCommandApplyEngine = ({
//     sheetIndex,
//     range,
//     styleCommand,
//     spread
// }: StyleCommandApplyEngineProps) => {

//     // 유틸리티 함수들
//     const convertHorizontalAlign = (align: string) => {
//         switch (align) {
//             case "left": return GC.Spread.Sheets.HorizontalAlign.left;
//             case "center": return GC.Spread.Sheets.HorizontalAlign.center;
//             case "right": return GC.Spread.Sheets.HorizontalAlign.right;
//             case "centerContinuous": return GC.Spread.Sheets.HorizontalAlign.centerContinuous;
//             case "distributed": return GC.Spread.Sheets.HorizontalAlign.distributed;

//             default: return GC.Spread.Sheets.HorizontalAlign.left;
//         }
//     };

//     const convertVerticalAlign = (align: string) => {
//         switch (align) {
//             case "top": return GC.Spread.Sheets.VerticalAlign.top;
//             case "center": return GC.Spread.Sheets.VerticalAlign.center;
//             case "bottom": return GC.Spread.Sheets.VerticalAlign.bottom;
//             default: return GC.Spread.Sheets.VerticalAlign.top;
//         }
//     };

//     const convertLineStyle = (style: string) => {
//         switch (style) {
//             case "empty": return GC.Spread.Sheets.LineStyle.empty;
//             case "thin": return GC.Spread.Sheets.LineStyle.thin;
//             case "medium": return GC.Spread.Sheets.LineStyle.medium;
//             case "thick": return GC.Spread.Sheets.LineStyle.thick;
//             case "double": return GC.Spread.Sheets.LineStyle.double;
//             case "dotted": return GC.Spread.Sheets.LineStyle.dotted;
//             case "dashed": return GC.Spread.Sheets.LineStyle.dashed;
//             default: return GC.Spread.Sheets.LineStyle.thin;
//         }
//     };

//     const convertTextDecoration = (decoration: string) => {
//         switch (decoration) {
//             case "none": return GC.Spread.Sheets.TextDecorationType.none;
//             case "underline": return GC.Spread.Sheets.TextDecorationType.underline;
//             case "overline": return GC.Spread.Sheets.TextDecorationType.overline;
//             case "lineThrough": return GC.Spread.Sheets.TextDecorationType.lineThrough;
//             default: return GC.Spread.Sheets.TextDecorationType.none;
//         }
//     };

//     const createLineBorder = (borderInfo: BorderInfo) => {
//         return new GC.Spread.Sheets.LineBorder(
//             borderInfo.color,
//             convertLineStyle(borderInfo.style)
//         );
//     };

//     const setStyleProperties = (style: any, properties: StyleProperties) => {
//         // 색상 설정
//         if (properties.backColor) style.backColor = properties.backColor;
//         if (properties.foreColor) style.foreColor = properties.foreColor;

//         // 글꼴 설정
//         if (properties.font) style.font = properties.font;
//         if (properties.fontFamily) style.fontFamily = properties.fontFamily;
//         if (properties.fontSize) style.fontSize = properties.fontSize;
//         if (properties.fontStyle) style.fontStyle = properties.fontStyle;
//         if (properties.fontWeight) style.fontWeight = properties.fontWeight;

//         // 정렬 설정
//         if (properties.hAlign) {
//             style.hAlign = convertHorizontalAlign(properties.hAlign);
//         }
//         if (properties.vAlign) {
//             style.vAlign = convertVerticalAlign(properties.vAlign);
//         }
//         if (properties.textIndent !== undefined) style.textIndent = properties.textIndent;
//         if (properties.textOrientation !== undefined) style.textOrientation = properties.textOrientation;
//         if (properties.isVerticalText !== undefined) style.isVerticalText = properties.isVerticalText;

//         // 테두리 설정
//         if (properties.borderLeft) style.borderLeft = createLineBorder(properties.borderLeft);
//         if (properties.borderTop) style.borderTop = createLineBorder(properties.borderTop);
//         if (properties.borderRight) style.borderRight = createLineBorder(properties.borderRight);
//         if (properties.borderBottom) style.borderBottom = createLineBorder(properties.borderBottom);
//         if (properties.diagonalDown) style.diagonalDown = createLineBorder(properties.diagonalDown);
//         if (properties.diagonalUp) style.diagonalUp = createLineBorder(properties.diagonalUp);

//         // 텍스트 표시 설정
//         if (properties.wordWrap !== undefined) style.wordWrap = properties.wordWrap;
//         if (properties.shrinkToFit !== undefined) style.shrinkToFit = properties.shrinkToFit;
//         if (properties.showEllipsis !== undefined) style.showEllipsis = properties.showEllipsis;
//         if (properties.textDecoration) {
//             style.textDecoration = convertTextDecoration(properties.textDecoration);
//         }

//         // 보호 설정
//         if (properties.locked !== undefined) style.locked = properties.locked;
//         if (properties.hidden !== undefined) style.hidden = properties.hidden;

//         // 기타 설정
//         if (properties.formatter) style.formatter = properties.formatter;
//         if (properties.backgroundImage) style.backgroundImage = properties.backgroundImage;
//         if (properties.cellPadding) style.cellPadding = properties.cellPadding;
//         if (properties.watermark) style.watermark = properties.watermark;
//     };

//     const applyDirectProperties = (targetRange: any, properties: StyleProperties) => {
//         // 색상
//         if (properties.backColor) targetRange.backColor(properties.backColor);
//         if (properties.foreColor) targetRange.foreColor(properties.foreColor);

//         // 글꼴
//         if (properties.font) targetRange.font(properties.font);
//         if (properties.fontFamily) targetRange.fontFamily(properties.fontFamily);
//         if (properties.fontSize) targetRange.fontSize(properties.fontSize);
//         if (properties.fontStyle) targetRange.fontStyle(properties.fontStyle);
//         if (properties.fontWeight) targetRange.fontWeight(properties.fontWeight);

//         // 정렬
//         if (properties.hAlign) {
//             targetRange.hAlign(convertHorizontalAlign(properties.hAlign));
//         }
//         if (properties.vAlign) {
//             targetRange.vAlign(convertVerticalAlign(properties.vAlign));
//         }
//         if (properties.textIndent !== undefined) targetRange.textIndent(properties.textIndent);
//         if (properties.textOrientation !== undefined) targetRange.textOrientation(properties.textOrientation);
//         if (properties.isVerticalText !== undefined) targetRange.isVerticalText(properties.isVerticalText);

//         // 테두리
//         if (properties.borderLeft) targetRange.borderLeft(createLineBorder(properties.borderLeft));
//         if (properties.borderTop) targetRange.borderTop(createLineBorder(properties.borderTop));
//         if (properties.borderRight) targetRange.borderRight(createLineBorder(properties.borderRight));
//         if (properties.borderBottom) targetRange.borderBottom(createLineBorder(properties.borderBottom));
//         if (properties.diagonalDown) targetRange.diagonalDown(createLineBorder(properties.diagonalDown));
//         if (properties.diagonalUp) targetRange.diagonalUp(createLineBorder(properties.diagonalUp));

//         // 텍스트 표시
//         if (properties.wordWrap !== undefined) targetRange.wordWrap(properties.wordWrap);
//         if (properties.shrinkToFit !== undefined) targetRange.shrinkToFit(properties.shrinkToFit);
//         if (properties.showEllipsis !== undefined) targetRange.showEllipsis(properties.showEllipsis);
//         if (properties.textDecoration) {
//             targetRange.textDecoration(convertTextDecoration(properties.textDecoration));
//         }

//         // 보호
//         if (properties.locked !== undefined) targetRange.locked(properties.locked);
//         if (properties.hidden !== undefined) targetRange.hidden(properties.hidden);

//         // 기타
//         if (properties.formatter) targetRange.formatter(properties.formatter);
//         if (properties.backgroundImage) targetRange.backgroundImage(properties.backgroundImage);
//         if (properties.cellPadding) targetRange.cellPadding(properties.cellPadding);
//         if (properties.watermark) targetRange.watermark(properties.watermark);
//     };

//     const applyStyleObject = (sheet: any, range: number[], properties: StyleProperties) => {
//         const style = new GC.Spread.Sheets.Style();
//         setStyleProperties(style, properties);

//         if (range.length === 2) {
//             // 개별 셀 [row, col]
//             sheet.setStyle(range[0], range[1], style);
//         } else if (range.length === 4) {
//             // 범위 [row, col, rowCount, colCount]
//             for (let row = range[0]; row < range[0] + range[2]; row++) {
//                 for (let col = range[1]; col < range[1] + range[3]; col++) {
//                     sheet.setStyle(row, col, style);
//                 }
//             }
//         }
//     };

//     const applyDirectMethod = (sheet: any, range: number[], properties: StyleProperties) => {
//         let targetRange;

//         if (range.length === 2) {
//             // 개별 셀
//             targetRange = sheet.getCell(range[0], range[1]);
//         } else if (range.length === 4) {
//             // 범위
//             targetRange = sheet.getRange(range[0], range[1], range[2], range[3]);
//         }

//         if (targetRange) {
//             applyDirectProperties(targetRange, properties);
//         }
//     };

//     // 메인 실행 함수 - 명령어를 반환하는 함수
//     const executeStyleCommand = () => {
//         try {
//             const targetSheet = spread.getSheet(sheetIndex);

//             switch (styleCommand.method) {
//                 case "style_object":
//                     applyStyleObject(targetSheet, range, styleCommand.properties);
//                     return {
//                         success: true,
//                         message: "Style object applied successfully",
//                         appliedMethod: "style_object",
//                         appliedRange: range,
//                         appliedProperties: styleCommand.properties
//                     };

//                 case "direct_method":
//                     applyDirectMethod(targetSheet, range, styleCommand.properties);
//                     return {
//                         success: true,
//                         message: "Direct method applied successfully",
//                         appliedMethod: "direct_method",
//                         appliedRange: range,
//                         appliedProperties: styleCommand.properties
//                     };

//                 default:
//                     return {
//                         success: false,
//                         message: `Unknown style method: ${styleCommand.method}`,
//                         appliedMethod: null,
//                         appliedRange: range,
//                         appliedProperties: null
//                     };
//             }
//         } catch (error) {
//             return {
//                 success: false,
//                 message: `Error applying style: ${error}`,
//                 appliedMethod: styleCommand.method,
//                 appliedRange: range,
//                 appliedProperties: styleCommand.properties,
//                 error: error
//             };
//         }
//     };

//     return { executeStyleCommand };
// };

// export default useStyleCommandApplyEngine;