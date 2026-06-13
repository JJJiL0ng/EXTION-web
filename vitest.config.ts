import path from 'node:path';
import { defineConfig } from 'vitest/config';

const testMockPath = (fileName: string) => path.resolve(__dirname, 'src/test/mocks', fileName);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@mescius/spread-sheets': testMockPath('spreadjs.ts'),
      '@mescius/spread-sheets-react': testMockPath('spreadjs-react.tsx'),
      '@mescius/spread-excelio': testMockPath('spread-excelio.ts'),
      '@grapecity/spread-excelio': testMockPath('spread-excelio.ts'),
      '@mescius/spread-sheets-io': testMockPath('empty-module.ts'),
      '@mescius/spread-sheets-resources-ko': testMockPath('empty-module.ts'),
      '@mescius/spread-sheets-charts': testMockPath('empty-module.ts'),
      '@mescius/spread-sheets-shapes': testMockPath('empty-module.ts'),
      'socket.io-client': testMockPath('socket-io-client.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'build'],
    css: true,
  },
});
