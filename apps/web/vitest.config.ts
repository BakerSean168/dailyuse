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
    '@dailyuse/authentication/client': '../../packages/authentication/src/client/index.ts',
    '@dailyuse/reminder/client': '../../packages/reminder/src/client/index.ts',
    '@dailyuse/schedule/client': '../../packages/schedule/src/client/index.ts',
    '@dailyuse/notification/client': '../../packages/notification/src/client/index.ts',
    '@dailyuse/editor/client': '../../packages/editor/src/client/index.ts',
    '@dailyuse/ai/client': '../../packages/ai/src/client/index.ts',
    '@dailyuse/goal/client': '../../packages/goal/src/client/index.ts',
    '@dailyuse/repository/client': '../../packages/repository/src/client/index.ts',
    '@dailyuse/task/client': '../../packages/task/src/client/index.ts',
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
    passWithNoTests: false,
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
