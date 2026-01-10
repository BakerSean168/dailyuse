import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/scheduler/index.ts',
    'src/repository/index.ts',
    'src/cache/index.ts',
    'src/events/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
