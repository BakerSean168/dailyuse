import { defineConfig } from 'tsup';
import { createLocalOnlyDtsPaths } from '../../tools/build/tsup.base.config.ts';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: createLocalOnlyDtsPaths(),
  clean: true,
  sourcemap: true,
});
