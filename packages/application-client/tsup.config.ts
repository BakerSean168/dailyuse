import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/account/index.ts',
    'src/ai/index.ts',
    'src/authentication/index.ts',
    'src/dashboard/index.ts',
    'src/focus/index.ts',
    'src/goal/index.ts',
    'src/notification/index.ts',
    'src/reminder/index.ts',
    'src/repository/index.ts',
    'src/schedule/index.ts',
    'src/setting/index.ts',
    'src/task/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    '@dailyuse/contracts',
    '@dailyuse/domain-client',
    '@dailyuse/infrastructure-client',
    '@dailyuse/utils',
  ],
  sourcemap: true,
});
