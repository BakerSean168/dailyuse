/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
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

/**
 * Create a shared configuration for a project
 */
export function createSharedConfig(options: SharedConfigOptions) {
  const { projectRoot, environment = 'node', aliases = {}, aliasEntries = [] } = options;
  const projectSrc = path.resolve(projectRoot, './src');
  const workspaceRoot = path.resolve(projectRoot, '../..');

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

  // Common aliases for all projects
  const baseAliases = {
    ...resolvedAliases,
    '@': projectSrc,
    '@/': `${projectSrc}/`,
    '@dailyuse/utils': path.resolve(projectRoot, '../../packages/utils/src'),
  };

  const baseAliasEntries = Object.entries(baseAliases)
    .sort(([a], [b]) => b.length - a.length)
    .map(([find, replacement]) => ({ find, replacement }));

  const finalAliasEntries = [
    ...resolvedAliasEntries,
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
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/test/', 'prisma/', '**/*.d.ts', '**/*.config.*', 'dist/'],
      },
    },
  });
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
