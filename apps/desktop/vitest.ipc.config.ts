import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { createContractsAliasEntries } from '../../vite.workspace-aliases';

export default defineConfig({
  test: {
    name: 'desktop-ipc',
    // Keep IPC tests rooted under src/main so they exercise handler registration
    // without pulling renderer-only setup into the suite.
    root: resolve(__dirname, 'src/main'),
    include: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: true,
    // Centralized setup owns the Electron mock surface for all IPC specs.
    setupFiles: ['./ipc/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Coverage stays focused on IPC handlers; test doubles live alongside them.
      include: ['ipc/**/*.ts'],
      exclude: ['ipc/__tests__/**', 'ipc/index.ts'],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: [
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
        find: '@memoflow/account/electron',
        replacement: resolve(__dirname, '../../packages/account/src/electron/index.ts'),
      },
      {
        find: '@memoflow/account',
        replacement: resolve(__dirname, '../../packages/account/src/index.ts'),
      },
      {
        find: '@memoflow/powersync-schema',
        replacement: resolve(__dirname, '../../packages/powersync-schema/src/index.ts'),
      },
      {
        find: '@memoflow/data-portability/electron',
        replacement: resolve(__dirname, '../../packages/data-portability/src/electron/index.ts'),
      },
    ],
  },
});
