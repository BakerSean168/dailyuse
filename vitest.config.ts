/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import {
  createPackageResolveAliases,
  domainResolveAliases,
} from './vitest.workspace-helpers';

// Vitest projects add signal/exit listeners in several worker modes.
// Raise the cap slightly to avoid tool-internal listener noise in CI.
process.setMaxListeners(32);

/**
 * Vitest Configuration for Memoflow Monorepo
 *
 * This file configures all test projects in the monorepo using the test.projects field.
 * Each project can have its own configuration while inheriting common settings.
 *
 * Documentation: https://vitest.dev/guide/projects
 *
 * Note: This configuration is now in the main vitest config file, not a separate workspace file.
 * The workspace file format has been deprecated in Vitest 3.x.
 */
// Root config keeps project registry + cross-project defaults.
// Alias/plugin helpers are centralized in vitest.workspace-helpers.ts.

export default defineConfig({
  assetsInclude: ['**/*.icns'],
  test: {
    // Global configuration that affects all projects
    // Coverage is configured at workspace level
    coverage: {
      enabled: false, // Enable via CLI: vitest --coverage
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/*.integration.test.ts',
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

    // Keep local runs detailed, but make CI logs compact and high-signal.
    reporters: process.env.CI ? ['dot'] : ['verbose'],

    // Root vitest.config.ts acts as the workspace registry for cross-project runs.
    // Some Nx targets still point at per-project configs when they need app-local
    // setup or different include rules, but the shared alias model lives here.
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
      // Setting unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('setting') },
        test: {
          name: 'setting',
          root: './packages/setting',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
          testTimeout: 10000,
        },
      },
      // Account unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('account') },
        test: {
          name: 'account',
          root: './packages/account',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
          testTimeout: 10000,
        },
      },
      // Goal unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('goal') },
        test: {
          name: 'goal',
          root: './packages/goal',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
          testTimeout: 10000,
        },
      },
      // Governance unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('governance') },
        test: {
          name: 'governance',
          root: './packages/governance',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Reminder unit tests
      {
        extends: true,
        resolve: {
          alias: createPackageResolveAliases('reminder', [
            // Reminder cross-package dependencies
            {
              find: '@dailyuse/schedule',
              replacement: path.resolve(__dirname, './packages/schedule/src/index.ts'),
            },
            {
              find: '@dailyuse/http-client',
              replacement: path.resolve(__dirname, './packages/http-client/src/index.ts'),
            },
          ]),
        },
        test: {
          name: 'reminder',
          root: './packages/reminder',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // AI unit tests
      {
        extends: true,
        resolve: { alias: domainResolveAliases },
        test: {
          name: 'ai',
          root: './packages/ai',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Authentication unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('authentication') },
        test: {
          name: 'authentication',
          root: './packages/authentication',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Schedule unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('schedule') },
        test: {
          name: 'schedule',
          root: './packages/schedule',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Repository unit tests
      {
        extends: true,
        resolve: { alias: createPackageResolveAliases('repository') },
        test: {
          name: 'repository',
          root: './packages/repository',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Patterns unit tests
      {
        extends: true,
        test: {
          name: 'patterns',
          root: './packages/patterns',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Assets unit tests
      {
        extends: true,
        test: {
          name: 'assets',
          root: './packages/assets',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
        },
      },
      // Task and application boundaries use their own per-project configs so
      // the root workspace file stays a thin registry instead of carrying
      // project-specific alias and setup complexity.
      './packages/task/vitest.config.ts',
      './packages/task/vitest.integration.config.ts',
      './apps/api/vitest.config.ts',
      './apps/api/vitest.smoke.config.ts',
      './packages/app-vue/vitest.config.ts',
      './apps/desktop/vitest.config.ts',
      './apps/desktop/vitest.ipc.config.ts',
      './apps/desktop/vitest.main.config.ts',
      './apps/web/vitest.config.ts',
    ],

    // Global test settings
    globals: true,
    passWithNoTests: true,

    // Bail early in CI environments
    bail: process.env.CI ? 1 : 0,
  },
});
