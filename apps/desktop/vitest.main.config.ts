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
        find: '@memoflow/domain-shared/shared',
        replacement: resolve(__dirname, '../../packages/domain-shared/src/shared/index.ts'),
      },
      {
        find: '@memoflow/domain-shared',
        replacement: resolve(__dirname, '../../packages/domain-shared/src'),
      },
      {
        find: '@memoflow/utils',
        replacement: resolve(__dirname, '../../packages/utils/src'),
      },
      {
        find: '@memoflow/goal/client',
        replacement: resolve(__dirname, '../../packages/goal/src/client/index.ts'),
      },
      {
        find: '@memoflow/goal/electron',
        replacement: resolve(__dirname, '../../packages/goal/src/electron/index.ts'),
      },
      {
        find: '@memoflow/goal/schedule-execution',
        replacement: resolve(__dirname, '../../packages/goal/src/schedule-execution/index.ts'),
      },
      {
        find: '@memoflow/goal/schedule-projection',
        replacement: resolve(__dirname, '../../packages/goal/src/schedule-projection/index.ts'),
      },
      {
        find: '@memoflow/goal/events',
        replacement: resolve(__dirname, '../../packages/goal/src/events/index.ts'),
      },
      {
        find: '@memoflow/goal/analytics',
        replacement: resolve(__dirname, '../../packages/goal/src/analytics/index.ts'),
      },
      {
        find: '@memoflow/account/electron',
        replacement: resolve(__dirname, '../../packages/account/src/electron/index.ts'),
      },
      {
        find: '@memoflow/account',
        replacement: resolve(__dirname, '../../packages/account/src/index.ts'),
      },
      {
        find: '@memoflow/schedule-orchestration',
        replacement: resolve(__dirname, '../../packages/schedule-orchestration/src/index.ts'),
      },
    ],
  },
});
