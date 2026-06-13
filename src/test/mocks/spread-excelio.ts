import { vi } from 'vitest';

export class IO {
  open = vi.fn();
  save = vi.fn();
}

const ExcelIO = {
  IO,
};

export default ExcelIO;
