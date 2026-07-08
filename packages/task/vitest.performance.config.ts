/// <reference types="vitest" />
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

const benchmarkIncludes = [
  'src/server/application/__tests__/benchmarks/sort-algorithm.bench.ts',
  'src/server/application/__tests__/benchmarks/service-sorting.bench.ts',
  'src/server/application/__tests__/benchmarks/stability.bench.ts',
  'src/server/application/__tests__/benchmarks/http-endpoint.bench.ts',
];

const sharedConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'node',
  testInclude: benchmarkIncludes,
  aliases: {
    '@/server/domain': './src/server/domain/index.ts',
    '@dailyuse/contracts/task': '../contracts/src/modules/task/index.ts',
    '@dailyuse/contracts/result': '../contracts/src/result/index.ts',
    '@dailyuse/contracts/shared': '../contracts/src/shared/index.ts',
    '@dailyuse/contracts/primitives': '../contracts/src/primitives/index.ts',
    '@dailyuse/test-utils': '../test-utils/src/index.ts',
    '@dailyuse/test-utils/mocks': '../test-utils/src/mocks/index.ts',
    '@dailyuse/test-utils/helpers/result-matchers': '../test-utils/src/helpers/result-matchers.ts',
    '@dailyuse/task/testing': './src/testing/index.ts',
    '@dailyuse/task': './src/index.ts',
    '@dailyuse/domain-shared': '../../packages/domain-shared/src',
    '@dailyuse/database': '../../packages/database/src',
  },
}) as UserConfig;

const projectConfig = defineConfig({
  root: __dirname,
  resolve: {
    alias: [
      { find: '@/server/', replacement: `${__dirname}/src/server/` },
    ],
  },
  test: {
    name: 'task-performance',
    // Keep the performance suite opt-in and deterministic. Bench files are
    // intentionally allowlisted here so normal `task:test` runs stay fast.
    include: benchmarkIncludes,
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 30000,
    // Use a forked Node runtime to reduce interference from the current CLI process.
    pool: 'forks',
  },
}) as UserConfig;

export default mergeConfig(sharedConfig, projectConfig);
