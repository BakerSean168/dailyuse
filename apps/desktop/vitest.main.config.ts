/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { resolve } from 'path';

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

