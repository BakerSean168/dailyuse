import vue from '@vitejs/plugin-vue';
import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import { createSharedConfig, createSliceCoverage } from '../../vitest.shared';
import { createUiVueSourceAliasEntries } from '../../vite.workspace-aliases';

const workspaceRoot = path.resolve(__dirname, '../..');

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'happy-dom',
    testInclude: ['src/modules/**/stores/**/*.{test,spec}.{ts,tsx}'],
    aliasEntries: createUiVueSourceAliasEntries(workspaceRoot),
    aliases: {
      '@dailyuse/http-client': '../../packages/http-client/src/index.ts',
      '@dailyuse/ai/application-client': '../../packages/ai/src/application-client/index.ts',
      '@dailyuse/ai/infrastructure-client': '../../packages/ai/src/infrastructure-client/index.ts',
      '@dailyuse/task/domain-client': '../../packages/task/src/domain-client/index.ts',
      '@dailyuse/repository/domain-client': '../../packages/repository/src/domain-client/index.ts',
    },
  }),
  defineConfig({
    root: __dirname,
    plugins: [vue()],
    test: {
      name: 'app-vue-store-coverage',
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: createSliceCoverage({
        projectRoot: __dirname,
        roots: ['src/modules'],
        reportsDirectory: 'coverage/packages/app-vue/stores',
        fileIncludePattern: /^src\/modules\/.+\/stores\/[^/]+\.ts$/,
        thresholds: {
          statements: 70,
          lines: 70,
          functions: 70,
          branches: 60,
        },
      }),
    },
  }),
);
