import { vi } from 'vitest';

class MockWorksheet {
  name = vi.fn();
  setDataSource = vi.fn();
  getDataSource = vi.fn(() => []);
  getRowCount = vi.fn(() => 0);
  getColumnCount = vi.fn(() => 0);
  getCell = vi.fn(() => ({
    value: vi.fn(),
    text: vi.fn(),
    backColor: vi.fn(),
    foreColor: vi.fn(),
    font: vi.fn(),
  }));
}

class MockWorkbook {
  getActiveSheet = vi.fn(() => new MockWorksheet());
  getSheet = vi.fn(() => new MockWorksheet());
  getSheetFromName = vi.fn(() => new MockWorksheet());
  getSheetCount = vi.fn(() => 1);
  addSheet = vi.fn();
  removeSheet = vi.fn();
  suspendPaint = vi.fn();
  resumePaint = vi.fn();
  fromJSON = vi.fn();
  toJSON = vi.fn(() => ({}));
  bind = vi.fn();
  unbind = vi.fn();
}

export const Spread = {
  Sheets: {
    Workbook: MockWorkbook,
    Worksheet: MockWorksheet,
    Events: {},
    LicenseKey: '',
  },
};

const GC = {
  Spread,
};

export default GC;
