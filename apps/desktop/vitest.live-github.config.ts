import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'desktop-live-github',
    include: ['src/main/modules/repository/github-knowledge-repository.live.ts'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
