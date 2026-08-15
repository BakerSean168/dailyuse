/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { createVitestReportConfig } from '../../vitest.shared';
import {
  domainResolveAtAlias,
  taskDeepImportResolver,
  taskResolveAliases,
} from '../../vitest.workspace-helpers';

export default defineConfig({
  plugins: [taskDeepImportResolver, domainResolveAtAlias],
  resolve: {
    alias: [
      {
        find: /^@\/(.+)/,
        replacement: path.resolve(__dirname, '../../packages/task/src/$1'),
      },
      {
        // Intentional testing export only (RefArch Phase 2): resolve the AI
        // smoke surface to source so the smoke exercises the actual router,
        // controller and dispatch chain — no catch-all private-path bypass.
        find: /^@memoflow\/ai\/testing$/,
        replacement: path.resolve(__dirname, '../../packages/ai/src/testing/index.ts'),
      },
      ...taskResolveAliases,
    ],
  },
  test: {
    name: 'api-smoke',
    ...createVitestReportConfig(__dirname, 'api-smoke'),
    root: __dirname,
    globals: true,
    environment: 'node',
    include: ['src/__tests__/smoke/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 15000,
  },
});
