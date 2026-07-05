/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
  }),
  defineConfig({
    test: {
      name: 'schedule-orchestration',
      root: __dirname,
      testTimeout: 10000,
      pool: 'forks',
    },
  }),
);
