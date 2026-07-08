/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createPackageVitestConfig } from '../../vitest.shared';

const baseConfig = createPackageVitestConfig({
  projectRoot: __dirname,
  environment: 'node',
  name: 'reminder',
  governedCoverage: true,
  aliasEntries: [
    {
      find: /^@dailyuse\/schedule$/,
      replacement: path.resolve(__dirname, 'src/__tests__/schedule-package-shim.ts'),
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
