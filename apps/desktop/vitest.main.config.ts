/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { resolve } from 'path';
import { createSharedConfig } from '../../vitest.shared';

// Subpath aliases that must win over the generic @memoflow/<pkg>/... source
// regexes createSharedConfig generates. Kept explicit so main-process specs
// pin the exact entrypoint instead of relying on directory resolution.
const mainWorkspaceAliasEntries = [
  {
    find: /^electron$/,
    replacement: resolve(__dirname, './test-support/electron.stub.ts'),
  },
  {
    find: '@memoflow/domain-shared/shared',
    replacement: resolve(__dirname, '../../packages/domain-shared/src/shared/index.ts'),
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
    find: '@memoflow/data-portability/electron',
    replacement: resolve(__dirname, '../../packages/data-portability/src/electron/index.ts'),
  },
  {
    find: '@memoflow/schedule-orchestration',
    replacement: resolve(__dirname, '../../packages/schedule-orchestration/src/index.ts'),
  },
] as const;

const sharedConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'node',
  reportName: 'desktop-main',
  aliasEntries: mainWorkspaceAliasEntries,
}) as Record<string, unknown>;

export default defineConfig({
  ...sharedConfig,
  test: {
    ...(sharedConfig.test ?? {}),
    name: 'desktop-main',
    root: path.resolve(__dirname, 'src/main'),
    globals: true,
    environment: 'node',
    include: [
      'database/**/*.{test,spec}.ts',
      '__tests__/bootstrap.{test,spec}.ts',
      'lifecycle/**/*.{test,spec}.ts',
    ],
    exclude: ['node_modules', 'dist', 'dist-electron', '.git', '.cache'],
  },
});
