/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import { createSharedConfig } from '../../vitest.shared';
import { createUiVueSourceAliasEntries } from '../../vite.workspace-aliases';

const workspaceRoot = path.resolve(__dirname, '../..');

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'happy-dom',
    aliasEntries: createUiVueSourceAliasEntries(workspaceRoot),
    aliases: {
      '@dailyuse/app-vue': '../../packages/app-vue/src/index.ts',
      '@dailyuse/authentication/application-client':
        '../../packages/authentication/src/application-client/index.ts',
      '@dailyuse/authentication/infrastructure-client':
        '../../packages/authentication/src/infrastructure-client/index.ts',
      '@dailyuse/ai/application-client': '../../packages/ai/src/application-client/index.ts',
      '@dailyuse/ai/infrastructure-client': '../../packages/ai/src/infrastructure-client/index.ts',
    },
  }),
  defineConfig({
    root: __dirname,
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false,
          },
        },
      }),
    ],
    test: {
      name: 'web',
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.spec.ts'],
      exclude: ['node_modules', 'dist', '.git', '.cache'],
      passWithNoTests: true,
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
      server: {
        deps: {
          inline: [],
        },
      },
    },
  }),
);
