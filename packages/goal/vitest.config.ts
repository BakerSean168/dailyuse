/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createPackageVitestConfig } from '../../vitest.shared';

const baseConfig = createPackageVitestConfig({
  projectRoot: __dirname,
  environment: 'node',
  name: 'goal',
  governedCoverage: true,
  aliasEntries: [
    {
      find: /^@memoflow\/schedule$/,
      replacement: path.resolve(__dirname, '../test-utils/src/shims/schedule-package-shim.ts'), // Residual 1035 sole
    },
  ],
});

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // Base config already includes coverage
    },
  }),
);
