/// <reference types="vitest" />
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

const sharedConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'node',
  aliases: {
    '@/domain-server': './src/domain-server/index.ts',
    '@/domain-shared': './src/domain-shared/index.ts',
    '@dailyuse/contracts/task': '../contracts/src/modules/task/index.ts',
    '@dailyuse/contracts/result': '../contracts/src/result/index.ts',
    '@dailyuse/contracts/shared': '../contracts/src/shared/index.ts',
    '@dailyuse/contracts/primitives': '../contracts/src/primitives/index.ts',
    '@dailyuse/test-utils': '../test-utils/src/index.ts',
    '@dailyuse/test-utils/mocks': '../test-utils/src/mocks/index.ts',
    '@dailyuse/test-utils/helpers/result-matchers': '../test-utils/src/helpers/result-matchers.ts',
    '@dailyuse/test-utils/fixtures': '../test-utils/src/fixtures/index.ts',
    '@dailyuse/task': './src/index.ts',
    '@dailyuse/task/domain-shared': './src/domain-shared/index.ts',
    '@dailyuse/task/domain-server': './src/domain-server/index.ts',
    '@dailyuse/domain-shared': '../../packages/domain-shared/src',
    '@dailyuse/database': '../../packages/database/src',
  },
}) as UserConfig;

const projectConfig = defineConfig({
  root: __dirname,
  resolve: {
    alias: [
      { find: '@/domain-server/', replacement: `${__dirname}/src/domain-server/` },
      { find: '@/domain-shared/', replacement: `${__dirname}/src/domain-shared/` },
    ],
  },
  test: {
    name: 'task-performance',
    // Keep the performance suite opt-in and deterministic. Bench files are
    // intentionally allowlisted here so normal `task:test` runs stay fast.
    include: [
      'src/application-server/__tests__/benchmarks/sort-algorithm.bench.ts',
      'src/application-server/__tests__/benchmarks/service-sorting.bench.ts',
      'src/application-server/__tests__/benchmarks/stability.bench.ts',
      'src/application-server/__tests__/benchmarks/http-endpoint.bench.ts',
    ],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 30000,
    // Use a forked Node runtime to reduce interference from the current CLI process.
    pool: 'forks',
  },
}) as UserConfig;

export default mergeConfig(sharedConfig, projectConfig);
