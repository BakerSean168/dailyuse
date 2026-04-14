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
    // domain: business logic, depends on shared + infra (for repos/db)
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
        '@typescript-eslint/no-unused-vars': 'warn',
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
        'vue/no-unused-vars': 'warn',
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
      files: [
        '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
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
  storybook.configs['flat/recommended'],
);
