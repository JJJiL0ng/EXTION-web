"use client";

import * as GC from "@mescius/spread-sheets";
import { CellDelta, DeltaAction, CellStyle } from '@/_types/delta';

/**
 * SpreadJS 인스턴스에 서버에서 받은 델타를 적용하는 유틸리티 훅
 */
export const useSpreadSheetDeltaApply = () => {
  
  /**
   * 서버에서 받은 델타를 SpreadJS에 적용
   */
  const applyDeltaToSpreadJS = (spreadjs: any, delta: CellDelta, isApplyingServerDelta: { current: boolean }) => {
    if (!spreadjs) return;

    isApplyingServerDelta.current = true;
    
    try {
      const sheet = spreadjs.getSheetFromName?.(delta.sheetName) || spreadjs.getActiveSheet();
      if (!sheet) {
        console.warn(`시트를 찾을 수 없습니다: ${delta.sheetName}`);
        return;
      }

      switch (delta.action) {
        case DeltaAction.SET_CELL_VALUE:
          if (delta.cellAddress) {
            const { row, col } = parseAddress(delta.cellAddress);
            sheet.setValue(row, col, delta.value);
          }
          break;
          
        case DeltaAction.SET_CELL_FORMULA:
          if (delta.cellAddress && delta.formula) {
            const { row, col } = parseAddress(delta.cellAddress);
            sheet.setFormula(row, col, delta.formula);
          }
          break;
          
        case DeltaAction.SET_CELL_STYLE:
          if (delta.cellAddress && delta.style) {
            const { row, col } = parseAddress(delta.cellAddress);
            const spreadJSStyle = convertCellStyleToSpreadJS(delta.style);
            sheet.setStyle(row, col, spreadJSStyle);
          } else if (delta.range && delta.style) {
            const range = parseRange(delta.range);
            if (range) {
              const spreadJSStyle = convertCellStyleToSpreadJS(delta.style);
              sheet.setStyle(range.startRow, range.startCol, range.rowCount, range.colCount, spreadJSStyle);
            }
          }
          break;
          
        case DeltaAction.DELETE_CELLS:
          if (delta.cellAddress) {
            const { row, col } = parseAddress(delta.cellAddress);
            sheet.setValue(row, col, null);
          } else if (delta.range) {
            const range = parseRange(delta.range);
            if (range) {
              // SpreadJS에서 ClearType이 다르게 정의되어 있을 수 있음
            try {
              sheet.clear(range.startRow, range.startCol, range.rowCount, range.colCount, 1); // 1 = data clear
            } catch {
              // fallback: 범위의 각 셀을 개별적으로 null로 설정
              for (let r = range.startRow; r < range.startRow + range.rowCount; r++) {
                for (let c = range.startCol; c < range.startCol + range.colCount; c++) {
                  sheet.setValue(r, c, null);
                }
              }
            }
            }
          }
          break;
          
        case DeltaAction.INSERT_ROWS:
          if (typeof delta.rowIndex === 'number' && typeof delta.count === 'number') {
            sheet.addRows(delta.rowIndex, delta.count);
          }
          break;
          
        case DeltaAction.DELETE_ROWS:
          if (typeof delta.rowIndex === 'number' && typeof delta.count === 'number') {
            sheet.deleteRows(delta.rowIndex, delta.count);
          }
          break;
          
        case DeltaAction.INSERT_COLUMNS:
          if (typeof delta.columnIndex === 'number' && typeof delta.count === 'number') {
            sheet.addColumns(delta.columnIndex, delta.count);
          }
          break;
          
        case DeltaAction.DELETE_COLUMNS:
          if (typeof delta.columnIndex === 'number' && typeof delta.count === 'number') {
            sheet.deleteColumns(delta.columnIndex, delta.count);
          }
          break;
          
        case DeltaAction.ADD_SHEET:
          if (delta.sheetName) {
            const newSheet = new GC.Spread.Sheets.Worksheet(delta.sheetName);
            spreadjs.addSheet(spreadjs.getSheetCount(), newSheet);
          }
          break;
          
        case DeltaAction.DELETE_SHEET:
          if (delta.sheetName) {
            const sheetIndex = spreadjs.getSheetIndex(delta.sheetName);
            if (sheetIndex >= 0) {
              spreadjs.removeSheet(sheetIndex);
            }
          }
          break;
          
        case DeltaAction.RENAME_SHEET:
          if (delta.sheetName && delta.value) {
            const currentSheet = spreadjs.getSheetFromName(delta.sheetName);
            if (currentSheet) {
              currentSheet.name(delta.value);
            }
          }
          break;
          
        default:
          console.warn(`지원되지 않는 델타 액션: ${delta.action}`);
      }
      
    } catch (error) {
      console.error('델타 적용 실패:', error, delta);
      throw error;
    } finally {
      isApplyingServerDelta.current = false;
    }
  };

  return {
    applyDeltaToSpreadJS
  };
};

// 유틸리티 함수들
function parseAddress(address: string): { row: number; col: number } {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid address: ${address}`);
  
  const col = columnToNumber(match[1]);
  const row = parseInt(match[2]) - 1;
  
  return { row, col };
}

function parseRange(range: string): { startRow: number; startCol: number; rowCount: number; colCount: number } | null {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  const startCol = columnToNumber(match[1]);
  const startRow = parseInt(match[2]) - 1;
  const endCol = columnToNumber(match[3]);
  const endRow = parseInt(match[4]) - 1;
  
  return {
    startRow,
    startCol,
    rowCount: endRow - startRow + 1,
    colCount: endCol - startCol + 1
  };
}

function columnToNumber(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64);
  }
  return result - 1;
}

function convertCellStyleToSpreadJS(style: CellStyle): any {
  const spreadJSStyle: any = {};
  
  if (style.backgroundColor) {
    spreadJSStyle.backColor = style.backgroundColor;
  }
  
  if (style.color) {
    spreadJSStyle.foreColor = style.color;
  }
  
  if (style.fontSize) {
    spreadJSStyle.fontSize = style.fontSize;
  }
  
  if (style.fontFamily) {
    spreadJSStyle.fontFamily = style.fontFamily;
  }
  
  if (style.fontWeight) {
    spreadJSStyle.fontWeight = style.fontWeight;
  }
  
  if (style.textAlign) {
    switch (style.textAlign) {
      case 'center':
        spreadJSStyle.hAlign = GC.Spread.Sheets.HorizontalAlign.center;
        break;
      case 'right':
        spreadJSStyle.hAlign = GC.Spread.Sheets.HorizontalAlign.right;
        break;
      case 'justify':
        // justify가 없는 경우 center로 fallback
        spreadJSStyle.hAlign = (GC.Spread.Sheets.HorizontalAlign as any).justify || GC.Spread.Sheets.HorizontalAlign.center;
        break;
      default:
        spreadJSStyle.hAlign = GC.Spread.Sheets.HorizontalAlign.left;
    }
  }
  
  if (style.verticalAlign) {
    switch (style.verticalAlign) {
      case 'middle':
        spreadJSStyle.vAlign = GC.Spread.Sheets.VerticalAlign.center;
        break;
      case 'bottom':
        spreadJSStyle.vAlign = GC.Spread.Sheets.VerticalAlign.bottom;
        break;
      default:
        spreadJSStyle.vAlign = GC.Spread.Sheets.VerticalAlign.top;
    }
  }
  
  if (style.border) {
    spreadJSStyle.borderLeft = convertBorderStyle(style.border.left);
    spreadJSStyle.borderTop = convertBorderStyle(style.border.top);
    spreadJSStyle.borderRight = convertBorderStyle(style.border.right);
    spreadJSStyle.borderBottom = convertBorderStyle(style.border.bottom);
  }
  
  return spreadJSStyle;
}

function convertBorderStyle(border?: { style: string; color: string; width: number }): any {
  if (!border) return undefined;
  
  return {
    color: border.color,
    style: getBorderStyle(border.style),
    width: border.width
  };
}

function getBorderStyle(style: string): number {
  switch (style.toLowerCase()) {
    case 'thin': return GC.Spread.Sheets.LineStyle.thin;
    case 'thick': return GC.Spread.Sheets.LineStyle.thick;
    case 'double': return GC.Spread.Sheets.LineStyle.double;
    case 'dotted': return GC.Spread.Sheets.LineStyle.dotted;
    case 'dashed': return GC.Spread.Sheets.LineStyle.dashed;
    default: return GC.Spread.Sheets.LineStyle.thin;
  }
}