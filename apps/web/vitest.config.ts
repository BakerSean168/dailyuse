/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { createSharedConfig } from '../../vitest.shared';
import { createUiVueSourceAliasEntries } from '../../vite.workspace-aliases';

const workspaceRoot = path.resolve(__dirname, '../..');
const sharedConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'happy-dom',
  aliasEntries: createUiVueSourceAliasEntries(workspaceRoot),
  aliases: {
    '@dailyuse/app-vue': '../../packages/app-vue/src/index.ts',
    '@dailyuse/app-vue/web-core': '../../packages/app-vue/src/web-core.ts',
    '@dailyuse/app-vue/web-shell-core': '../../packages/app-vue/src/web-shell-core.ts',
    '@dailyuse/app-vue/web-overlays': '../../packages/app-vue/src/web-overlays.ts',
    '@dailyuse/app-vue/web-bootstrap': '../../packages/app-vue/src/web-bootstrap.ts',
    '@dailyuse/app-vue/web-i18n': '../../packages/app-vue/src/web-i18n.ts',
    '@dailyuse/authentication/application-client':
      '../../packages/authentication/src/application-client/index.ts',
    '@dailyuse/authentication/infrastructure-client':
      '../../packages/authentication/src/infrastructure-client/index.ts',
    '@dailyuse/editor/application-client': '../../packages/editor/src/application-client/index.ts',
    '@dailyuse/editor/infrastructure-client':
      '../../packages/editor/src/infrastructure-client/index.ts',
    '@dailyuse/ai/application-client': '../../packages/ai/src/application-client/index.ts',
    '@dailyuse/ai/infrastructure-client': '../../packages/ai/src/infrastructure-client/index.ts',
    '@dailyuse/goal/infrastructure-client':
      '../../packages/goal/src/infrastructure-client/index.ts',
    '@dailyuse/repository/infrastructure-client':
      '../../packages/repository/src/infrastructure-client/index.ts',
    '@dailyuse/task/infrastructure-client':
      '../../packages/task/src/infrastructure-client/index.ts',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

export default defineConfig({
  ...sharedConfig,
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
    ...(sharedConfig.test ?? {}),
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
});
