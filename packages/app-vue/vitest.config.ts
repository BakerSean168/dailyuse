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
      '@dailyuse/http-client': '../../packages/http-client/src/index.ts',
      '@dailyuse/ai/client': '../../packages/ai/src/client/index.ts',
      '@dailyuse/goal/client': '../../packages/goal/src/client/index.ts',
      '@dailyuse/task/client': '../../packages/task/src/client/index.ts',
      '@dailyuse/repository/client': '../../packages/repository/src/client/index.ts',
    },
  }),
  defineConfig({
    root: __dirname,
    plugins: [vue()],
    test: {
      name: 'app-vue',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
);
