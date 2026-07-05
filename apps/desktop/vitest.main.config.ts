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
        find: '@dailyuse/authentication/api',
        replacement: resolve(__dirname, '../../packages/authentication/src/api/index.ts'),
      },
      {
        find: '@dailyuse/authentication/domain-shared',
        replacement: resolve(__dirname, '../../packages/authentication/src/domain-shared/index.ts'),
      },
      {
        find: '@dailyuse/authentication',
        replacement: resolve(__dirname, '../../packages/authentication/src/index.ts'),
      },
      {
        find: '@dailyuse/goal',
        replacement: resolve(__dirname, '../../packages/goal/src/index.ts'),
      },
      {
        find: '@dailyuse/account/api',
        replacement: resolve(__dirname, '../../packages/account/src/api/index.ts'),
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
