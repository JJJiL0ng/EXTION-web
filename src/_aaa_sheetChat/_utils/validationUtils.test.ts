import { describe, expect, it } from 'vitest';
import {
  generateUUID,
  isValidCellAddress,
  isValidFileName,
  isValidFormula,
  isValidHexColor,
  isValidRange,
  isValidUUID,
  validateCreateSpreadSheetRequest,
} from './validationUtils';

const validUuid = '123e4567-e89b-42d3-a456-426614174000';

describe('validationUtils', () => {
  it('validates UUID v4 strings', () => {
    expect(isValidUUID(validUuid)).toBe(true);
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });

  it('validates file names against backend DTO constraints', () => {
    expect(isValidFileName('sales-report.xlsx')).toBe(true);
    expect(isValidFileName('')).toBe(false);
    expect(isValidFileName('a'.repeat(256))).toBe(false);
    expect(isValidFileName('sales/report.xlsx')).toBe(false);
    expect(isValidFileName('sales\u0001report.xlsx')).toBe(false);
  });

  it('validates spreadsheet cell references and ranges', () => {
    expect(isValidCellAddress('A1')).toBe(true);
    expect(isValidCellAddress('AA10')).toBe(true);
    expect(isValidCellAddress('a1')).toBe(false);
    expect(isValidRange('A1:B5')).toBe(true);
    expect(isValidRange('A1-B5')).toBe(false);
  });

  it('validates colors and formulas', () => {
    expect(isValidHexColor('#A1b2C3')).toBe(true);
    expect(isValidHexColor('A1b2C3')).toBe(false);
    expect(isValidFormula('=SUM(A1:A3)')).toBe(true);
    expect(isValidFormula('SUM(A1:A3)')).toBe(false);
  });

  it('aggregates create spreadsheet request errors', () => {
    expect(
      validateCreateSpreadSheetRequest({
        fileName: 'sales.xlsx',
        spreadsheetId: validUuid,
        chatId: validUuid,
      }),
    ).toEqual({ isValid: true, errors: [] });

    const result = validateCreateSpreadSheetRequest({
      fileName: 'sales/report.xlsx',
      spreadsheetId: 'invalid',
      chatId: 'invalid',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it('generates UUID v4 strings', () => {
    expect(isValidUUID(generateUUID())).toBe(true);
  });
});
