/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { resolve } from 'path';
import { createContractsAliasEntries } from '../../vite.workspace-aliases';

export default defineConfig({
  test: {
    name: 'desktop-main',
    root: path.resolve(__dirname, 'src/main'),
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-electron', '.git', '.cache'],
  },
  resolve: {
    alias: [
      {
        find: /^electron$/,
        replacement: resolve(__dirname, './test-support/electron.stub.ts'),
      },
      ...createContractsAliasEntries(resolve(__dirname, '../..')),
      {
        find: '@dailyuse/domain-shared/shared',
        replacement: resolve(__dirname, '../../packages/domain-shared/src/shared/index.ts'),
      },
      {
        find: '@dailyuse/domain-shared',
        replacement: resolve(__dirname, '../../packages/domain-shared/src'),
      },
      {
        find: '@dailyuse/utils',
        replacement: resolve(__dirname, '../../packages/utils/src'),
      },
      {
        find: '@dailyuse/authentication/electron',
        replacement: resolve(__dirname, '../../packages/authentication/src/electron/index.ts'),
      },
      {
        find: '@dailyuse/authentication',
        replacement: resolve(__dirname, '../../packages/authentication/src/index.ts'),
      },
      {
        find: '@dailyuse/goal/client',
        replacement: resolve(__dirname, '../../packages/goal/src/client/index.ts'),
      },
      {
        find: '@dailyuse/goal/electron',
        replacement: resolve(__dirname, '../../packages/goal/src/electron/index.ts'),
      },
      {
        find: '@dailyuse/goal/schedule-execution',
        replacement: resolve(__dirname, '../../packages/goal/src/schedule-execution/index.ts'),
      },
      {
        find: '@dailyuse/goal/schedule-projection',
        replacement: resolve(__dirname, '../../packages/goal/src/schedule-projection/index.ts'),
      },
      {
        find: '@dailyuse/goal/events',
        replacement: resolve(__dirname, '../../packages/goal/src/events/index.ts'),
      },
      {
        find: '@dailyuse/goal/analytics',
        replacement: resolve(__dirname, '../../packages/goal/src/analytics/index.ts'),
      },
      {
        find: '@dailyuse/account/electron',
        replacement: resolve(__dirname, '../../packages/account/src/electron/index.ts'),
      },
      {
        find: '@dailyuse/account',
        replacement: resolve(__dirname, '../../packages/account/src/index.ts'),
      },
      {
        find: '@dailyuse/schedule-orchestration',
        replacement: resolve(__dirname, '../../packages/schedule-orchestration/src/index.ts'),
      },
    ],
  },
});
