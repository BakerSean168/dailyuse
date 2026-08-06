import { defineConfig } from 'vitest/config';
import { createVitestReportConfig } from '../../vitest.shared';

export default defineConfig({
  test: {
    name: 'governance-tools',
    ...createVitestReportConfig(__dirname, 'governance-tools'),
    root: __dirname,
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.mjs'],
  },
});
