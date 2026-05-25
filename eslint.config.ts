// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
// @ts-ignore
import nxPlugin from '@nx/eslint-plugin';

const moduleBoundaryDepConstraints = [
  {
    // shared: pure primitives, cannot depend on anything else
    sourceTag: 'layer:shared',
    onlyDependOnLibsWithTags: ['layer:shared'],
  },
  {
    // infra: technical plumbing, depends on shared only
    sourceTag: 'layer:infra',
    onlyDependOnLibsWithTags: ['layer:shared', 'layer:infra'],
  },
  {
    // domain: business logic + composition root (api/module.ts)
    // domain-server must NOT import infra; this rule allows domain -> infra
    // because composition roots (api/module.ts, electron-entry) live inside
    // domain-tagged packages and need to wire infra implementations.
    // See docs/standards/architecture.md "包内分层说明".
    sourceTag: 'layer:domain',
    onlyDependOnLibsWithTags: ['layer:shared', 'layer:infra', 'layer:domain'],
  },
  {
    // ui: presentation, can consume all layers
    sourceTag: 'layer:ui',
    onlyDependOnLibsWithTags: ['layer:shared', 'layer:infra', 'layer:domain', 'layer:ui'],
  },
  {
    // app: application shells, can consume everything
    sourceTag: 'layer:app',
    onlyDependOnLibsWithTags: [
      'layer:shared',
      'layer:infra',
      'layer:domain',
      'layer:ui',
      'layer:app',
    ],
  },
] as const;

const moduleBoundaryOptions = {
  enforceBuildableLibDependency: true,
  allow: ['./generated/prisma/**'],
  checkDynamicDependenciesExceptions: ['@dailyuse/database'],
  depConstraints: moduleBoundaryDepConstraints,
} as const;

export default tseslint.config(
  [
    {
      ignores: [
        '**/dist/**',
        '**/build/**',
        '**/node_modules/**',
        '**/coverage/**',
        '**/.nx/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/playwright-*-report/**',
        '**/dist-renderer/**',
        '**/dist-electron/**',
        '**/src/generated/prisma/**',
        '**/*.min.js',
        '**/*.d.ts',
      ],
    },
    {
      files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
      languageOptions: { globals: { ...globals.browser, ...globals.node } },
    },

    tseslint.configs.recommended,
    pluginVue.configs['flat/essential'],
    {
      files: ['**/*.vue'],
      languageOptions: { parserOptions: { parser: tseslint.parser } },
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        // 临时禁用这些规则，后续逐步修复
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        'vue/no-side-effects-in-computed-properties': 'warn',
        'vue/valid-v-slot': 'warn',
        'vue/no-v-text-v-html-on-component': 'warn',
        'vue/no-use-v-if-with-v-for': 'warn',
        'vue/no-unused-vars': ['warn', { ignorePattern: '^_' }],
      },
    },
    // ============ Module Boundary Enforcement ============
    // Dependency direction: shared ← infra ← domain ← ui
    {
      plugins: { '@nx': nxPlugin },
      rules: {
        '@nx/enforce-module-boundaries': ['error', moduleBoundaryOptions],
      },
    },
    {
      files: ['packages/goal/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['@dailyuse/task', '@dailyuse/task/*'],
          },
        ],
      },
    },
    {
      files: ['packages/task/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['@dailyuse/goal', '@dailyuse/goal/*'],
          },
        ],
      },
    },
    {
      files: [
        '**/eslint.config.{js,mjs,cjs,ts,mts,cts}',
        '**/tsup.config.{js,mjs,cjs,ts,mts,cts}',
        '**/vite.config.{js,mjs,cjs,ts,mts,cts}',
        '**/vitest*.config.{js,mjs,cjs,ts,mts,cts}',
      ],
      plugins: { '@nx': nxPlugin },
      rules: {
        '@nx/enforce-module-boundaries': 'off',
      },
    },
    {
      // Test files are exempt from module boundaries because they legitimately
      // import from multiple packages for mocking, setup, and fixture purposes.
      // TODO: Tighten to controlled exemption — allow test-utils/test-setup imports
      // but still block cross-feature production imports in tests.
      files: [
        '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/e2e/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
      plugins: { '@nx': nxPlugin },
      rules: {
        '@nx/enforce-module-boundaries': 'off',
      },
    },
    {
      files: ['**/src/test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
      plugins: { '@nx': nxPlugin },
      rules: {
        '@nx/enforce-module-boundaries': 'off',
      },
    },
    {
      files: ['packages/test-utils/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      plugins: { '@nx': nxPlugin },
      rules: {
        '@nx/enforce-module-boundaries': 'off',
      },
    },
  ],
  storybook.configs['flat/recommended'],
);
