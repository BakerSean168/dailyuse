/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import type { Alias } from 'vite';
import { createContractsAliasEntries } from './vite.workspace-aliases';

/**
 * Shared Vitest configuration for all projects
 *
 * This provides common settings that can be merged into individual project configs.
 * Use with mergeConfig() for custom configurations.
 *
 * @example
 * ```ts
 * import { defineConfig, mergeConfig } from 'vitest/config';
 * import { createSharedConfig } from '../../vitest.shared';
 *
 * export default mergeConfig(
 *   createSharedConfig({
 *     projectRoot: __dirname,
 *     environment: 'node',
 *   }),
 *   defineConfig({
 *     test: {
 *       name: 'my-project',
 *     }
 *   })
 * );
 * ```
 */

interface SharedConfigOptions {
  /** Project root directory (e.g., './packages/domain-server') */
  projectRoot: string;
  /** Test environment: 'node' | 'happy-dom' | 'jsdom' */
  environment?: 'node' | 'happy-dom' | 'jsdom';
  /** Additional path aliases */
  aliases?: Record<string, string>;
  /** Additional alias entries that must precede the generic @/@/ aliases */
  aliasEntries?: Alias[];
}

interface PackageVitestConfigOptions extends SharedConfigOptions {
  name: string;
  testTimeout?: number;
  pool?: 'forks' | 'threads' | 'vmForks' | 'vmThreads';
  setupFiles?: string[];
  governedCoverage?: boolean;
}

export const GOVERNED_DOMAIN_COVERAGE_THRESHOLDS = {
  statements: 80,
  lines: 80,
  functions: 80,
  branches: 70,
} as const;

function createGovernedCoverageInclude(projectRoot: string) {
  const projectName = path.basename(projectRoot);
  const baseInclude = [
    'src/domain-server/aggregates/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'src/domain-server/services/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'src/domain-server/value-objects/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'src/domain-shared/value-objects/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  ];

  if (projectName === 'domain-shared') {
    baseInclude.push('src/shared/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}');
  }

  return baseInclude;
}

export function createGovernedCoverage(projectRoot: string) {
  const workspaceRoot = path.resolve(projectRoot, '../..');
  const relativeProjectRoot = path
    .relative(workspaceRoot, projectRoot)
    .replaceAll(path.sep, '/');

  return {
    all: true,
    include: createGovernedCoverageInclude(projectRoot),
    exclude: [
      '**/index.ts',
      '**/*.d.ts',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    reportsDirectory: path.resolve(workspaceRoot, 'coverage', relativeProjectRoot),
    reporter: ['text', 'json', 'html', 'lcov'],
    thresholds: GOVERNED_DOMAIN_COVERAGE_THRESHOLDS,
  };
}

/**
 * Create a shared configuration for a project
 */
export function createSharedConfig(options: SharedConfigOptions) {
  const { projectRoot, environment = 'node', aliases = {}, aliasEntries = [] } = options;
  const projectSrc = path.resolve(projectRoot, './src');
  const workspaceRoot = path.resolve(projectRoot, '../..');
  const commonWorkspacePackages = [
    'account',
    'ai',
    'app-vue',
    'assets',
    'authentication',
    'dashboard',
    'editor',
    'goal',
    'governance',
    'http-client',
    'notification',
    'patterns',
    'reminder',
    'repository',
    'schedule',
    'setting',
    'task',
  ] as const;

  const resolvedAliases = Object.fromEntries(
    Object.entries(aliases).map(([key, value]) => [
      key,
      value.startsWith('.') ? path.resolve(projectRoot, value) : value,
    ]),
  );

  const resolvedAliasEntries = aliasEntries.map((entry) => ({
    ...entry,
    replacement:
      typeof entry.replacement === 'string' && entry.replacement.startsWith('.')
        ? path.resolve(projectRoot, entry.replacement)
        : entry.replacement,
  }));

  const commonWorkspaceAliasEntries: Alias[] = [
    {
      find: /^@dailyuse\/database\/prisma$/,
      replacement: path.resolve(workspaceRoot, 'packages/database/src/generated/prisma/client.js'),
    },
    {
      find: /^@dailyuse\/database\/powersync$/,
      replacement: path.resolve(workspaceRoot, 'packages/database/src/powersync-schema.ts'),
    },
    {
      find: /^@dailyuse\/database\/dashboard-schema$/,
      replacement: path.resolve(workspaceRoot, 'packages/database/src/dashboard-schema.ts'),
    },
    {
      find: /^@dailyuse\/domain-shared\/(.+)$/,
      replacement: path.resolve(workspaceRoot, 'packages/domain-shared/src/$1'),
    },
    {
      find: /^@dailyuse\/utils\/(.+)$/,
      replacement: path.resolve(workspaceRoot, 'packages/utils/src/$1'),
    },
    {
      find: /^@dailyuse\/test-utils\/(.+)$/,
      replacement: path.resolve(workspaceRoot, 'packages/test-utils/src/$1'),
    },
    ...commonWorkspacePackages.map(
      (packageName) =>
        ({
          find: new RegExp(`^@dailyuse\\/${packageName}\\/(.+)$`),
          replacement: path.resolve(workspaceRoot, `packages/${packageName}/src/$1`),
        }) satisfies Alias,
    ),
  ];

  const commonBareAliases = Object.fromEntries([
    ['@dailyuse/database', path.resolve(workspaceRoot, 'packages/database/src/index.ts')],
    ['@dailyuse/domain-shared', path.resolve(workspaceRoot, 'packages/domain-shared/src/index.ts')],
    ['@dailyuse/utils', path.resolve(workspaceRoot, 'packages/utils/src/index.ts')],
    ['@dailyuse/test-utils', path.resolve(workspaceRoot, 'packages/test-utils/src/index.ts')],
    ...commonWorkspacePackages.map((packageName) => [
      `@dailyuse/${packageName}`,
      path.resolve(workspaceRoot, `packages/${packageName}/src/index.ts`),
    ]),
  ]);

  // Common aliases for all projects
  const baseAliases = {
    ...commonBareAliases,
    ...resolvedAliases,
    '@': projectSrc,
    '@/': `${projectSrc}/`,
  };

  const baseAliasEntries = Object.entries(baseAliases)
    .sort(([a], [b]) => b.length - a.length)
    .map(([find, replacement]) => ({ find, replacement }));

  const finalAliasEntries = [
    ...resolvedAliasEntries,
    ...commonWorkspaceAliasEntries,
    ...createContractsAliasEntries(workspaceRoot),
    ...baseAliasEntries,
  ];

  return defineConfig({
    resolve: {
      alias: finalAliasEntries,
    },
    test: {
      globals: true,
      environment,
      passWithNoTests: true,
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        'dist-electron',
        '.git',
        '.cache',
        '.nx',
        'src/test/setup.ts',
        '**/prisma/**',
      ],
      coverage: {
        enabled: false, // Controlled by workspace config
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: ['node_modules/', 'src/test/', 'prisma/', '**/*.d.ts', '**/*.config.*', 'dist/'],
      },
    },
  });
}

export function createPackageVitestConfig(options: PackageVitestConfigOptions) {
  const {
    name,
    projectRoot,
    testTimeout = 10000,
    pool = 'forks',
    setupFiles,
    governedCoverage = false,
    ...sharedOptions
  } = options;

  return mergeConfig(
    createSharedConfig({
      projectRoot,
      ...sharedOptions,
    }),
    defineConfig({
      test: {
        name,
        root: projectRoot,
        testTimeout,
        pool,
        ...(setupFiles?.length ? { setupFiles } : {}),
        ...(governedCoverage
          ? {
              coverage: createGovernedCoverage(projectRoot),
            }
          : {}),
      },
    }),
  );
}

/**
 * Default shared configuration
 */
export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
