import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/domain-shared/index.ts',
    'src/domain-server/index.ts',
    'src/application-server/index.ts',
    'src/infrastructure-server/index.ts',
    'src/infrastructure-client/index.ts',
    'src/api/index.ts',
    'src/electron-entry/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  external: [
    'better-sqlite3',
    'electron',
    '@dailyuse/utils',
    '@dailyuse/contracts', '@dailyuse/http-client',
    '@dailyuse/database',
    '@dailyuse/domain-shared',
    'argon2',
    'express',
    'jsonwebtoken',
    'passport',
    'passport-jwt',
    'passport-local',
    'zod',
  ],
});
