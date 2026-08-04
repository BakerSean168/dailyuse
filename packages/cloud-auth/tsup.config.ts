import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/server/index.ts', 'src/client/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  external: ['@memoflow/database', '@memoflow/contracts', '@memoflow/http-client', '@memoflow/ipc-client', 'better-auth', '@better-auth/prisma-adapter', 'express'],
});
