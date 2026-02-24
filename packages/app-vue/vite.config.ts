import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      entryRoot: path.resolve(__dirname, 'src'),
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.stories.ts', 'src/**/*.stories.vue', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
      outDir: path.resolve(__dirname, 'dist'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external,
      output: {
        exports: 'named',
      },
    },
  },
});
