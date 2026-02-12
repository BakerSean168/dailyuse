import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  // ✅ 外部依赖：Prisma Client 不打包（运行时加载）
  external: ['@prisma/client'],
});
