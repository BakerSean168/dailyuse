/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
    aliases: {
      '@dailyuse/domain-shared': '../../packages/domain-shared/src',
      '@dailyuse/database': '../../packages/database/src',
    },
  }),
  defineConfig({
    test: {
      name: 'goal',
      testTimeout: 10000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: false,
        },
      },
    },
  }),
);
