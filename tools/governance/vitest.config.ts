import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'governance-tools',
    root: __dirname,
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.mjs'],
  },
});
