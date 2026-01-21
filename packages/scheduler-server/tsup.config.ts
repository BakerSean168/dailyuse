import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,  // 禁用自动 DTS 生成，因为 Bree 缺少类型
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  shims: true,
});
