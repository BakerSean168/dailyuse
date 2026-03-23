import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/domain-shared/index.ts',
    'src/domain-server/index.ts',
    'src/domain-client/index.ts',
    'src/application-server/index.ts',
    'src/infrastructure-server/index.ts',
    'src/api/index.ts',
    'src/electron-entry/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'electron',
    '@dailyuse/utils',
    '@dailyuse/contracts',
    '@dailyuse/database',
    '@dailyuse/domain-shared',
    '@dailyuse/domain-shared/shared',
    '@dailyuse/repository',
    '@dailyuse/repository/infrastructure-server',
    'express',
    'zod',
  ],
});
