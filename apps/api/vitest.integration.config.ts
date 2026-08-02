/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';
import { createIntegrationTestEnv } from '../../packages/test-utils/src/setup/database';

export default defineConfig({
  ...createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
  }),
  test: {
    name: 'api-integration',
    root: __dirname,
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 30_000,
    passWithNoTests: false,
    env: createIntegrationTestEnv(),
    globalSetup: [
      path.resolve(__dirname, '../../packages/test-utils/src/setup/integration-global-setup.ts'),
    ],
    fileParallelism: false,
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
  },
});
