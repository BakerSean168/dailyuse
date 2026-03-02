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
/**
 * Vite plugin to resolve @/ path alias based on which package the importer is in.
 *
 * Maps @/<subpath> to the correct package's src/ directory by checking the
 * importer's file path. This supports all domain packages that use @/ imports.
 */
const domainResolveAtAlias = {
  name: 'domain-resolve-at-alias',
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

    // Determine which package the importer belongs to
    const domainPackages = [
      'contracts',
      'task',
      'setting',
      'goal',
      'governance',
      'reminder',
      'ai',
      'authentication',
      'account',
      'notification',
      'editor',
      'repository',
      'schedule',
    ];
    let root: string | null = null;
    for (const pkg of domainPackages) {
      if (importer.startsWith(path.resolve(packagesDir, pkg) + '/')) {
        root = path.resolve(packagesDir, pkg, 'src');
        break;
      }
    }
    if (!root) return null;

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

/**
 * Vite plugin to resolve @dailyuse/contracts subpath imports.
 *
 * The contracts package has two kinds of subpaths:
 *   - Domain modules: ./task, ./goal, ... → src/modules/<name>/index.ts
 *   - Top-level dirs: ./result, ./shared, ./primitives, ... → src/<name>/index.ts
 *
 * This plugin tries src/modules/<subpath>/index.ts first, then falls back to
 * src/<subpath>/index.ts, handling both cases without needing explicit aliases.
 *
 * NOTE: This plugin only runs in the main Vite server process, NOT inside
 * Vitest fork workers (pool: 'forks'). The actual fork-worker resolution is
 * handled by `taskResolveAliases` (resolve.alias), which IS serialized to
 * workers. This plugin is kept as a redundant safety net for the main-thread
 * transform pipeline.
 */
const contractsDeepImportResolver = {
  name: 'contracts-deep-import-resolver',
  enforce: 'pre' as const,
  async resolveId(
    this: {
      resolve: (id: string, importer: string, opts: Record<string, unknown>) => Promise<unknown>;
    },
    source: string,
    importer: string | undefined,
    options: Record<string, unknown>,
  ) {
    const match = source.match(/^@dailyuse\/contracts\/(.+)/);
    if (!match || !importer) return null;
    const subpath = match[1];
    const contractsSrc = path.resolve(__dirname, 'packages/contracts/src');

    // Try modules dir first (domain modules like task, goal, etc.)
    const modulesIndex = path.resolve(contractsSrc, 'modules', subpath, 'index.ts');
    const modulesResult = await this.resolve(modulesIndex, importer, {
      ...options,
      skipSelf: true,
    });
    if (modulesResult) return modulesResult;

    // Fallback to top-level dir (result, shared, primitives, response, etc.)
    const topLevelIndex = path.resolve(contractsSrc, subpath, 'index.ts');
    const topLevelResult = await this.resolve(topLevelIndex, importer, {
      ...options,
      skipSelf: true,
    });
    if (topLevelResult) return topLevelResult;

    // Last resort: direct file
    const directFile = path.resolve(contractsSrc, subpath + '.ts');
    const directResult = await this.resolve(directFile, importer, {
      ...options,
      skipSelf: true,
    });
    if (directResult) return directResult;

    return null;
  },
};

/**
 * Shared resolve aliases for ALL domain packages.
 * Contains aliases for common workspace dependencies used by most test projects.
 *
 * IMPORTANT — ordering rules for Vite resolve.alias:
 *   1. Exact-string aliases are checked first (longest match wins).
 *   2. Regex aliases are checked in array order; first match wins.
 *   3. For a package with subpath imports (e.g. @dailyuse/contracts/task),
 *      the subpath regex MUST come BEFORE the bare-package alias.
 */
const contractsSrc = path.resolve(__dirname, './packages/contracts/src');

const domainResolveAliases = [
  // ── workspace packages (bare imports) ──
  {
    find: '@dailyuse/database',
    replacement: path.resolve(__dirname, './packages/database/src/index.ts'),
  },
  // ── @dailyuse/domain-shared (subpath regex BEFORE bare) ──
  {
    find: /^@dailyuse\/domain-shared\/(.+)/,
    replacement: path.resolve(__dirname, './packages/domain-shared/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/domain-shared',
    replacement: path.resolve(__dirname, './packages/domain-shared/src/index.ts'),
  },
  // ── @dailyuse/utils (subpath regex BEFORE bare) ──
  {
    find: /^@dailyuse\/utils\/(.+)/,
    replacement: path.resolve(__dirname, './packages/utils/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/utils',
    replacement: path.resolve(__dirname, './packages/utils/src/index.ts'),
  },
  {
    find: '@dailyuse/patterns',
    replacement: path.resolve(__dirname, './packages/patterns/src/index.ts'),
  },

  // ── @dailyuse/test-utils (subpath regex BEFORE bare) ──
  {
    find: /^@dailyuse\/test-utils\/(.+)/,
    replacement: path.resolve(__dirname, './packages/test-utils/src/$1'),
  },
  {
    find: '@dailyuse/test-utils',
    replacement: path.resolve(__dirname, './packages/test-utils/src/index.ts'),
  },

  // ── @dailyuse/contracts (subpath aliases BEFORE bare) ──
  // Top-level subpaths (src/<name>/index.ts) — must be explicit because
  // the catch-all regex below routes to src/modules/.
  {
    find: '@dailyuse/contracts/result',
    replacement: path.resolve(contractsSrc, 'result/index.ts'),
  },
  {
    find: '@dailyuse/contracts/shared',
    replacement: path.resolve(contractsSrc, 'shared/index.ts'),
  },
  {
    find: '@dailyuse/contracts/primitives',
    replacement: path.resolve(contractsSrc, 'primitives/index.ts'),
  },
  {
    find: '@dailyuse/contracts/electron',
    replacement: path.resolve(contractsSrc, 'electron/index.ts'),
  },
  {
    find: '@dailyuse/contracts/mocks',
    replacement: path.resolve(contractsSrc, 'mocks/index.ts'),
  },
  // Catch-all: domain module subpaths → src/modules/<name>/index.ts
  {
    find: /^@dailyuse\/contracts\/(.+)/,
    replacement: path.resolve(contractsSrc, 'modules/$1/index.ts'),
  },
  // Bare import
  {
    find: '@dailyuse/contracts',
    replacement: path.resolve(contractsSrc, 'index.ts'),
  },

  // ── @dailyuse/task (subpath regex BEFORE bare) ──
  // Included in domainResolveAliases because test-utils fixtures import
  // @dailyuse/task/domain-shared and @dailyuse/task/domain-server, so ANY
  // project that uses test-utils transitively needs these aliases.
  {
    find: /^@dailyuse\/task\/(.+)/,
    replacement: path.resolve(__dirname, './packages/task/src/$1/index.ts'),
  },
  {
    find: '@dailyuse/task',
    replacement: path.resolve(__dirname, './packages/task/src/index.ts'),
  },
];

/**
 * Task-specific resolve aliases (extends domainResolveAliases).
 * Currently identical to domainResolveAliases since the task aliases
 * were moved there for test-utils compatibility. Kept as a separate
 * variable for future task-only aliases.
 */
const taskResolveAliases = [...domainResolveAliases];

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
      // Setting unit tests
      {
        extends: true,
        plugins: [domainResolveAtAlias],
        resolve: { alias: domainResolveAliases },
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
        plugins: [domainResolveAtAlias],
        resolve: { alias: domainResolveAliases },
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
        plugins: [domainResolveAtAlias],
        resolve: { alias: domainResolveAliases },
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
        plugins: [domainResolveAtAlias],
        resolve: { alias: domainResolveAliases },
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
        plugins: [domainResolveAtAlias],
        resolve: {
          alias: [
            ...domainResolveAliases,
            // Reminder cross-package dependencies
            {
              find: '@dailyuse/schedule',
              replacement: path.resolve(__dirname, './packages/schedule/src/index.ts'),
            },
            {
              find: '@dailyuse/http-client',
              replacement: path.resolve(__dirname, './packages/http-client/src/index.ts'),
            },
          ],
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
      // Task unit tests (fast, no DB)
      {
        extends: true,
        plugins: [contractsDeepImportResolver, domainResolveAtAlias],
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
        plugins: [contractsDeepImportResolver, domainResolveAtAlias],
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
            'src/__tests__/smoke/**',
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
        plugins: [taskDeepImportResolver, domainResolveAtAlias],
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
      // app-vue unit tests
      {
        extends: true,
        plugins: [vue()],
        test: {
          name: 'app-vue',
          root: './packages/app-vue',
          environment: 'happy-dom',
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx,vue}'],
          exclude: ['node_modules', 'dist', '.git', '.cache'],
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
