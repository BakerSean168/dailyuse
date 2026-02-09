import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/contracts/index.ts',
    'src/domain-shared/index.ts',
    'src/domain-server/index.ts',
    'src/api/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@dailyuse/utils', '@dailyuse/database', 'express'],
});
