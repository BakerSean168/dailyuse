/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig, createSliceCoverage } from '../../vitest.shared';

const baseConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'node',
  testInclude: ['src/infrastructure-server/adapters/prisma/mappers/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
});

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'reminder-mappers',
      root: __dirname,
      coverage: createSliceCoverage({
        projectRoot: __dirname,
        roots: ['src/infrastructure-server/adapters/prisma/mappers'],
        reportsDirectory: 'coverage/packages/reminder/infrastructure-server-adapters-prisma-mappers',
        thresholds: {
          statements: 80,
          lines: 80,
          functions: 80,
          branches: 70,
        },
      }),
    },
  }),
);
