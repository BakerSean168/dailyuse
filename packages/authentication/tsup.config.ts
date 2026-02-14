import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'domain-shared': 'src/domain-shared/index.ts',
    'domain-server': 'src/domain-server/index.ts',
    'application-server': 'src/application-server/index.ts',
    'infrastructure-server': 'src/infrastructure-server/index.ts',
    'infrastructure-client': 'src/infrastructure-client/index.ts',
    api: 'src/api/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  external: [
    '@dailyuse/utils',
    '@dailyuse/contracts',
    '@dailyuse/contracts/result',
    '@dailyuse/database',
    '@dailyuse/domain-shared',
    '@dailyuse/http-client',
    'argon2',
    'express',
    'jsonwebtoken',
    'passport',
    'passport-jwt',
    'passport-local',
    'zod',
  ],
});
