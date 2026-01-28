/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

/**
 * Vitest Configuration for domain-shared package
 *
 * This configuration merges with the shared config and adds project-specific settings.
 * The workspace configuration (vitest.workspace.ts) takes precedence when running tests
 * from the workspace root.
 */
export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
  }),
  defineConfig({
    test: {
      name: 'domain-shared',
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: 10000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: false,
        },
      },
    },
  }),
);