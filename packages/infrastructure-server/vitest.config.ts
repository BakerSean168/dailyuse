import { defineConfig } from 'vitest/config';
import vitestShared from '../../vitest.shared';
import path from 'node:path';

export default defineConfig({
  ...vitestShared,
  resolve: {
    alias: {
      '@dailyuse/contracts/authentication': path.resolve(__dirname, '../contracts/src/modules/authentication'),
      '@dailyuse/contracts/result': path.resolve(__dirname, '../contracts/src/result'),
      '@dailyuse/contracts/response': path.resolve(__dirname, '../contracts/src/response'),
      '@dailyuse/contracts': path.resolve(__dirname, '../contracts/src'),
      '@dailyuse/utils': path.resolve(__dirname, '../utils/src'),
      '@dailyuse/domain-server': path.resolve(__dirname, '../domain-server/src'),
    },
  },
  test: {
    ...vitestShared.test,
    name: 'infrastructure-server',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
  },
});
