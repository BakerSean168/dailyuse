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
// Shared Vite plugin + resolve aliases for the task package (unit + integration projects)
const taskResolveAtAlias = {
  name: 'resolve-at-alias',
  async resolveId(
    this: {
      resolve: (id: string, importer: string, opts: Record<string, unknown>) => Promise<unknown>;
    },
    source: string,
    importer: string | undefined,
    options: Record<string, unknown>,
  ) {
    if (!source.startsWith('@/') || !importer) return null;
    const subpath = source.slice(2);
    const packagesDir = path.resolve(__dirname, 'packages');
    let root: string;
    if (importer.startsWith(path.resolve(packagesDir, 'contracts') + '/')) {
      root = path.resolve(packagesDir, 'contracts/src');
    } else if (importer.startsWith(path.resolve(packagesDir, 'task') + '/')) {
      root = path.resolve(packagesDir, 'task/src');
    } else {
      root = path.resolve(packagesDir, 'task/src');
    }
    const resolved = path.resolve(root, subpath);
    const result = await this.resolve(resolved, importer, {
      ...options,
      skipSelf: true,
    });
    return result;
  },
};

/**
 * Vite plugin to resolve @dailyuse/task deep path imports.
 *
 * The package.json `exports` field only exposes top-level subpaths (e.g. ./api, ./domain-server).
 * Deep paths like @dailyuse/task/api/controllers/task-template.controller fail
 * because Node's resolver checks `exports` BEFORE Vite's resolve.alias can intercept.
 *
 * This plugin runs at Vite plugin priority (before Node resolution) and maps
 * @dailyuse/task/<subpath> -> packages/task/src/<subpath>, trying:
 *   1. <subpath>.ts          (for direct file imports)
 *   2. <subpath>/index.ts    (for directory barrel imports)
 */
const taskDeepImportResolver = {
  name: 'task-deep-import-resolver',
  enforce: 'pre' as const,
  async resolveId(
    this: {
      resolve: (id: string, importer: string, opts: Record<string, unknown>) => Promise<unknown>;
    },
    source: string,
    importer: string | undefined,
    options: Record<string, unknown>,
  ) {
    const match = source.match(/^@dailyuse\/task\/(.+)/);
    if (!match || !importer) return null;
    const subpath = match[1];
    const taskSrc = path.resolve(__dirname, 'packages/task/src');

    // Try direct file first (e.g. api/controllers/task-template.controller -> .ts)
    const directFile = path.resolve(taskSrc, subpath + '.ts');
    const directResult = await this.resolve(directFile, importer, {
      ...options,
      skipSelf: true,
    });
    if (directResult) return directResult;

    // Fallback to index barrel (e.g. domain-server -> domain-server/index.ts)
    const indexFile = path.resolve(taskSrc, subpath, 'index.ts');
    const indexResult = await this.resolve(indexFile, importer, {
      ...options,
      skipSelf: true,
    });
    if (indexResult) return indexResult;

    return null;
  },
};

const taskResolveAliases = [
  {
    find: '@dailyuse/database',
    replacement: path.resolve(__dirname, './packages/database/src/index.ts'),
  },
  {
    find: '@dailyuse/domain-shared',
    replacement: path.resolve(__dirname, './packages/domain-shared/src/index.ts'),
  },
  {
    find: /^@dailyuse\/contracts\/(.+)/,
    replacement: path.resolve(__dirname, './packages/contracts/src/modules/$1/index.ts'),
  },
  {
    find: '@dailyuse/contracts',
    replacement: path.resolve(__dirname, './packages/contracts/src'),
  },
  {
    find: '@dailyuse/utils',
    replacement: path.resolve(__dirname, './packages/utils/src/index.ts'),
  },
  {
    find: '@dailyuse/patterns',
    replacement: path.resolve(__dirname, './packages/patterns/src/index.ts'),
  },
  {
    find: /^@dailyuse\/test-utils\/(.+)/,
    replacement: path.resolve(__dirname, './packages/test-utils/src/$1'),
  },
  {
    find: '@dailyuse/test-utils',
    replacement: path.resolve(__dirname, './packages/test-utils/src/index.ts'),
  },
  {
    find: /^@dailyuse\/task\/(.+)/,
    replacement: path.resolve(__dirname, './packages/task/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/task',
    replacement: path.resolve(__dirname, './packages/task/src/index.ts'),
  },
];

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
      // Task unit tests (fast, no DB)
      {
        extends: true,
        plugins: [taskResolveAtAlias],
        resolve: { alias: taskResolveAliases },
        test: {
          name: 'task',
          root: './packages/task',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: [
            'node_modules',
            'dist',
            '.git',
            '.cache',
            'src/**/*.integration.{test,spec}.{js,ts}',
          ],
          testTimeout: 10000,
        },
      },
      // Task integration tests (requires Docker PostgreSQL)
      {
        extends: true,
        plugins: [taskResolveAtAlias],
        resolve: { alias: taskResolveAliases },
        test: {
          name: 'task-integration',
          root: './packages/task',
          environment: 'node',
          include: ['src/**/*.integration.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
          testTimeout: 30000,
          env: {
            DATABASE_URL: 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
          },
          globalSetup: [
            path.resolve(__dirname, './packages/task/src/__tests__/integration-global-setup.ts'),
          ],
          fileParallelism: false, // Run test files sequentially to avoid DB conflicts
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true, // All files in one fork (shared process)
            },
          },
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
          exclude: [
            'node_modules',
            'dist',
            '.git',
            '.cache',
            'src/test/setup.ts',
            'prisma/**/*',
            'src/**/*.integration.{test,spec}.{js,ts}',
          ],
          testTimeout: 30000,
          // API tests use single fork to avoid database conflicts
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
      },
      // API smoke tests (Supertest → Express → real Use Cases → mock Repos)
      {
        extends: true,
        plugins: [taskDeepImportResolver, taskResolveAtAlias],
        resolve: {
          alias: [
            // Deep path aliases for task controllers/routes (NOT in barrel exports)
            // These MUST come BEFORE the generic @dailyuse/task/(.+) alias
            {
              find: '@dailyuse/task/api/controllers/task-template.controller',
              replacement: path.resolve(
                __dirname,
                './packages/task/src/api/controllers/task-template.controller.ts',
              ),
            },
            {
              find: '@dailyuse/task/api/controllers/task-instance.controller',
              replacement: path.resolve(
                __dirname,
                './packages/task/src/api/controllers/task-instance.controller.ts',
              ),
            },
            {
              find: '@dailyuse/task/api/routes',
              replacement: path.resolve(__dirname, './packages/task/src/api/routes/index.ts'),
            },
            ...taskResolveAliases,
            {
              find: /^@dailyuse\/utils\/(.+)/,
              replacement: path.resolve(__dirname, './packages/utils/src/$1/index.ts'),
            },
          ],
        },
        test: {
          name: 'api-smoke',
          root: './apps/api',
          environment: 'node',
          include: ['src/__tests__/smoke/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
          testTimeout: 15000,
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
