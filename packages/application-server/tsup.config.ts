import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/goal/index.ts',
    'src/task/index.ts',
    'src/schedule/index.ts',
    'src/reminder/index.ts',
    'src/repository/index.ts',
    'src/dashboard/index.ts',
    'src/setting/index.ts',
    'src/notification/index.ts',
    'src/ai/index.ts',
    'src/sync/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    '@dailyuse/contracts',
    '@dailyuse/utils',
    'uuid',
  ],
  sourcemap: true,
});
