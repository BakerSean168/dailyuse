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
  splitting: false,
  external: [
    'electron',
    '@memoflow/utils',
    '@memoflow/contracts',
    '@memoflow/http-client',
    '@memoflow/database',
    '@memoflow/domain-shared',
    '@memoflow/patterns',
    'argon2',
    'express',
    'jsonwebtoken',
    'passport',
    'passport-jwt',
    'passport-local',
    'zod',
  ],
});
