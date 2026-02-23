import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dailyuse/contracts': path.resolve(__dirname, '../contracts/src'),
      '@dailyuse/database': path.resolve(__dirname, '../database/src'),
      '@dailyuse/domain-shared': path.resolve(__dirname, '../domain-shared/src'),
      '@dailyuse/utils': path.resolve(__dirname, '../utils/src'),
      '@dailyuse/schedule': path.resolve(__dirname, '../schedule/src'),
      '@dailyuse/patterns': path.resolve(__dirname, '../patterns/src'),
      '@dailyuse/http-client': path.resolve(__dirname, '../http-client/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
