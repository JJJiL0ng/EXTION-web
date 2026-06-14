import { vi } from 'vitest';

export class Socket {
  connected = true;
  on = vi.fn();
  once = vi.fn();
  off = vi.fn();
  emit = vi.fn();
  disconnect = vi.fn();
  connect = vi.fn();
}

export const io = vi.fn(() => new Socket());

export default io;
