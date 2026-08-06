import { defineConfig } from 'vitest/config';
import { createVitestReportConfig } from '../../vitest.shared';

export default defineConfig({
  test: {
    ...createVitestReportConfig(__dirname, 'migrator'),
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
