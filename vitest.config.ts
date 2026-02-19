/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

/**
 * Vitest Configuration for DailyUse Monorepo
 *
 * This file configures all test projects in the monorepo using the test.projects field.
 * Each project can have its own configuration while inheriting common settings.
 *
 * Documentation: https://vitest.dev/guide/projects
 *
 * Note: This configuration is now in the main vitest config file, not a separate workspace file.
 * The workspace file format has been deprecated in Vitest 3.x.
 */
export default defineConfig({
  test: {
    // Global configuration that affects all projects
    // Coverage is configured at workspace level
    coverage: {
      enabled: false, // Enable via CLI: vitest --coverage
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        '**/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/prisma/**',
        '**/.{git,cache,nx}/**',
      ],
      // Collect coverage from all source files
      include: ['apps/**/src/**', 'packages/**/src/**'],
    },

    // Global reporters for all projects
    reporters: process.env.CI ? ['verbose', 'json', 'html'] : ['verbose'],

    // Define all test projects in the workspace
    projects: [
      // ===================
      // Library Projects
      // ===================
      {
        extends: true,
        test: {
          name: 'contracts',
          root: './packages/contracts',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      {
        extends: true,
        test: {
          name: 'domain-server',
          root: './packages/domain-server',
          environment: 'node',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache', 'src/test/setup.ts'],
          testTimeout: 10000,
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: false,
            },
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'domain-client',
          root: './packages/domain-client',
          environment: 'happy-dom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache', 'src/test/setup.ts'],
          testTimeout: 5000,
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: false,
            },
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          root: './packages/ui',
          environment: 'happy-dom',
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '@dailyuse/contracts': path.resolve(__dirname, './packages/contracts/src'),
          },
        },
        test: {
          name: 'utils',
          root: './packages/utils',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },

      // ===================
      // Application Projects
      // ===================
      {
        extends: true,
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './apps/api/src'),
            '@dailyuse/domain-server': path.resolve(__dirname, './packages/domain-server/src'),
            '@dailyuse/contracts': path.resolve(__dirname, './packages/contracts/src'),
            '@dailyuse/utils': path.resolve(__dirname, './packages/utils/src'),
          },
        },
        test: {
          name: 'api',
          root: './apps/api',
          environment: 'node',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.{test,spec}.{js,ts}'],
          // Exclude integration tests that require PostgreSQL
          exclude: ['node_modules', 'dist', '.git', '.cache', 'src/test/setup.ts', 'prisma/**/*', 'src/**/*.integration.{test,spec}.{js,ts}'],
          testTimeout: 30000,
          // API tests use single fork to avoid database conflicts
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
          // Disable globalSetup for unit tests - only needed for integration tests
          // globalSetup: './src/test/globalSetup.ts',
        },
      },
      {
        extends: true,
        test: {
          name: 'desktop',
          root: './apps/desktop',
          environment: 'happy-dom',
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['node_modules', 'dist', 'dist-electron', '.git', '.cache'],
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './apps/web/src'),
            '@dailyuse/domain-client': path.resolve(__dirname, './packages/domain-client/src'),
            '@dailyuse/contracts': path.resolve(__dirname, './packages/contracts/src'),
            '@dailyuse/utils': path.resolve(__dirname, './packages/utils/src'),
            '@dailyuse/ui-vuetify': path.resolve(__dirname, './packages/ui-vuetify/src'),
          },
        },
        plugins: [vue()],
        test: {
          name: 'web',
          root: './apps/web',
          environment: 'happy-dom',
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
          css: {
            modules: {
              classNameStrategy: 'non-scoped',
            },
          },
        },
      },
    ],

    // Global test settings
    globals: true,
    passWithNoTests: true,

    // Bail early in CI environments
    bail: process.env.CI ? 1 : 0,
  },
});
