/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import {
  contractsDeepImportResolver,
  createPackageResolveAliases,
  domainResolveAtAlias,
} from '../../vitest.workspace-helpers';
import { createVitestReportConfig } from '../../vitest.shared';
import { createIntegrationTestEnv } from '../test-utils/src/setup/database';

export default defineConfig({
  plugins: [contractsDeepImportResolver, domainResolveAtAlias],
  resolve: {
    alias: createPackageResolveAliases('account'),
  },
  test: {
    name: 'account-integration',
    ...createVitestReportConfig(__dirname, 'account-integration'),
    root: __dirname,
    globals: true,
    environment: 'node',
    env: createIntegrationTestEnv(),
    globalSetup: [path.resolve(__dirname, '../test-utils/src/setup/integration-global-setup.ts')],
    include: [
      'src/**/*.integration.test.ts',
      'src/**/*.integration.spec.ts',
    ],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
