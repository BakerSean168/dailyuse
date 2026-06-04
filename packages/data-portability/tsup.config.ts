import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/application-client/index.ts',
    'src/infrastructure-client/index.ts',
    'src/api/index.ts',
    'src/electron-entry/index.ts',
  ],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  external: [
    '@dailyuse/utils',
    '@dailyuse/contracts',
    '@dailyuse/http-client',
    '@dailyuse/database',
    '@dailyuse/domain-shared',
    '@dailyuse/goal',
    '@dailyuse/task',
    '@dailyuse/reminder',
    '@dailyuse/repository',
    '@dailyuse/schedule',
    '@dailyuse/editor',
    '@dailyuse/ai',
    '@dailyuse/notification',
    '@dailyuse/setting',
    'electron',
    'express',
    'zod',
  ],
});
