import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/api/index.ts',
    'src/client/index.ts',
    'src/electron/index.ts',
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
    '@dailyuse/goal',
    '@dailyuse/task',
    '@dailyuse/reminder',
    '@dailyuse/repository',
    '@dailyuse/schedule',
    '@dailyuse/ai',
    '@dailyuse/notification',
    '@dailyuse/setting',
    'electron',
    'express',
    'zod',
  ],
});
