import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

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
    alias: {
      '@dailyuse/contracts/authentication': resolve(
        __dirname,
        '../../packages/contracts/src/modules/authentication/index.ts',
      ),
      '@dailyuse/contracts/result': resolve(
        __dirname,
        '../../packages/contracts/src/result/index.ts',
      ),
      '@dailyuse/infrastructure-server': resolve(
        __dirname,
        '../../packages/infrastructure-server/src',
      ),
      '@dailyuse/domain-server': resolve(__dirname, '../../packages/domain-server/src'),
      '@dailyuse/domain-shared/shared': resolve(
        __dirname,
        '../../packages/domain-shared/src/shared/index.ts',
      ),
      '@dailyuse/domain-shared': resolve(__dirname, '../../packages/domain-shared/src'),
      '@dailyuse/application-server': resolve(__dirname, '../../packages/application-server/src'),
      '@dailyuse/contracts': resolve(__dirname, '../../packages/contracts/src'),
      '@dailyuse/utils': resolve(__dirname, '../../packages/utils/src'),
      '@dailyuse/account/domain-server': resolve(
        __dirname,
        '../../packages/account/src/domain-server/index.ts',
      ),
      '@dailyuse/account/domain-shared': resolve(
        __dirname,
        '../../packages/account/src/domain-shared/index.ts',
      ),
      '@dailyuse/authentication/domain-server': resolve(
        __dirname,
        '../../packages/authentication/src/domain-server/index.ts',
      ),
      '@dailyuse/authentication/domain-shared': resolve(
        __dirname,
        '../../packages/authentication/src/domain-shared/index.ts',
      ),
    },
  },
});
