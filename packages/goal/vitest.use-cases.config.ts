/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig, createSliceCoverage } from '../../vitest.shared';

const baseConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'node',
  testInclude: ['src/application-server/use-cases/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
});

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'goal-use-cases',
      root: __dirname,
      coverage: createSliceCoverage({
        projectRoot: __dirname,
        roots: ['src/application-server/use-cases'],
        reportsDirectory: 'coverage/packages/goal/application-server-use-cases',
        thresholds: {
          statements: 70,
          lines: 70,
          functions: 70,
          branches: 60,
        },
      }),
    },
  }),
);
