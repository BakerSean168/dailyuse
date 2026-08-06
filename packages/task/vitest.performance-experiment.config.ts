import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';
import { taskPerformanceAliases } from './vitest.performance.config';

const experimentIncludes = [
  'src/server/application/__tests__/benchmarks/memory.bench.ts',
  'src/server/application/__tests__/benchmarks/stability.bench.ts',
];

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
    testInclude: experimentIncludes,
    aliases: taskPerformanceAliases,
  }) as UserConfig,
  defineConfig({
    root: __dirname,
    test: {
      name: 'task-performance-experiment',
      include: experimentIncludes,
      exclude: ['node_modules', 'dist', '.git', '.cache'],
      testTimeout: 30000,
      pool: 'forks',
      execArgv: ['--expose-gc'],
    },
  }),
);
