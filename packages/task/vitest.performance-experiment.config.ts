import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';
import baseConfig from './vitest.performance.config';

export default mergeConfig(
  baseConfig as UserConfig,
  defineConfig({
    test: {
      name: 'task-performance-experiment',
      include: [
        'src/server/application/__tests__/benchmarks/memory.bench.ts',
        'src/server/application/__tests__/benchmarks/stability.bench.ts',
      ],
    },
  }),
);
