/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    name: 'desktop-main',
    root: path.resolve(__dirname, 'src/main'),
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-electron', '.git', '.cache'],
  },
});
