import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', '@dailyuse/ui-core', '@dailyuse/ui-react-shadcn'],
  sourcemap: true,
});
