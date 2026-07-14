import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/analytics/index.ts',
    'src/api/index.ts',
    'src/client/index.ts',
    'src/schedule-execution/index.ts',
    'src/schedule-projection/index.ts',
    'src/testing/index.ts',
    'src/electron/index.ts',
  ],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  external: [
    'electron',
    '@dailyuse/utils',
    '@dailyuse/contracts',
    '@dailyuse/http-client',
    '@dailyuse/database',
    '@dailyuse/domain-shared',
    '@dailyuse/domain-shared/shared',
    '@dailyuse/patterns',
    '@dailyuse/schedule',
    'express',
    'zod',
  ],
});
