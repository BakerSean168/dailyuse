/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import {
  contractsDeepImportResolver,
  createPackageResolveAliases,
  domainResolveAtAlias,
} from '../../vitest.workspace-helpers';

export default defineConfig({
  plugins: [contractsDeepImportResolver, domainResolveAtAlias],
  resolve: {
    alias: createPackageResolveAliases('goal'),
  },
  test: {
    name: 'goal-integration',
    root: __dirname,
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.integration.test.ts',
      'src/**/*.integration.spec.ts',
      'src/**/*.integration.test.js',
      'src/**/*.integration.spec.js',
    ],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 30000,
    passWithNoTests: false,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        process.env.DATABASE_URL ??
        'postgresql://test_user:test_pass@127.0.0.1:5433/Memoflow_test',
    },
    globalSetup: [path.resolve(__dirname, './src/__tests__/integration-global-setup.ts')],
    fileParallelism: false,
    sequence: {
      groupOrder: 1,
    },
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
  },
});
