import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/contracts/index.ts',
    'src/domain-shared/index.ts',
    'src/domain-server/index.ts',
    'src/domain-client/index.ts',
    'src/api/index.ts',
    'src/application-server/index.ts',
    'src/application-client/index.ts',
    'src/infrastructure-server/index.ts',
    'src/infrastructure-server/powersync.ts',
    'src/infrastructure-client/index.ts',
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
    '@dailyuse/http-client',
    '@dailyuse/database',
    'express',
  ],
});
