import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
  }),
  defineConfig({
    root: __dirname,
    test: {
      name: 'desktop',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'node',
    },
  }),
);
