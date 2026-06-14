import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MAX_UPLOAD_FILE_SIZE,
  getUploadFileExtension,
  validateUploadFile,
} from './fileUploadValidation';

describe('fileUploadValidation', () => {
  it('extracts lowercase file extensions', () => {
    expect(getUploadFileExtension('Sales.XLSX')).toBe('xlsx');
    expect(getUploadFileExtension('report')).toBeNull();
  });

  it('accepts supported spreadsheet files', () => {
    expect(
      validateUploadFile({
        name: 'sales.xlsx',
        size: 1024,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    ).toEqual({ isValid: true });
  });

  it('allows empty MIME types from browsers that do not report them', () => {
    expect(
      validateUploadFile({
        name: 'sales.csv',
        size: 1024,
        type: '',
      })
    ).toEqual({ isValid: true });
  });

  it('rejects files over the configured size limit', () => {
    const result = validateUploadFile({
      name: 'sales.xlsx',
      size: DEFAULT_MAX_UPLOAD_FILE_SIZE + 1,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('50MB');
  });

  it('rejects unsupported extensions and MIME types', () => {
    expect(
      validateUploadFile({
        name: 'sales.pdf',
        size: 1024,
        type: 'application/pdf',
      }).isValid
    ).toBe(false);

    expect(
      validateUploadFile({
        name: 'sales.xlsx',
        size: 1024,
        type: 'application/pdf',
      }).isValid
    ).toBe(false);
  });
});
