import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  plugins: [vue()],
  build: {
    outDir: path.resolve(here, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
});
