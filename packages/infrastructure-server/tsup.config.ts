import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    // Module-based entries
    'src/goal/index.ts',
    'src/task/index.ts',
    'src/schedule/index.ts',
    'src/reminder/index.ts',
    'src/account/index.ts',
    'src/authentication/index.ts',
    'src/ai/index.ts',
    'src/notification/index.ts',
    'src/dashboard/index.ts',
    'src/repository/index.ts',
    'src/setting/index.ts',
    'src/sync/index.ts',
    'src/shared/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    '@dailyuse/contracts',
    '@dailyuse/domain-server',
    '@dailyuse/utils',
    '@prisma/client',
  ],
  sourcemap: true,
});
