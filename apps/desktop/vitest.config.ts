import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';
import {
  createAppVueSourceAliasEntries,
  createWorkspaceSourceAliasEntries,
} from '../../vite.workspace-aliases';

// Desktop renderer tests import many workspace packages through their source
// entrypoints so Electron-specific adapters stay aligned with local edits.
const desktopTestWorkspaceEntries = [
  ['@dailyuse/account/client', 'packages/account/src/client/index.ts'],
  ['@dailyuse/account/electron', 'packages/account/src/electron/index.ts'],
  ['@dailyuse/authentication/client', 'packages/authentication/src/client/index.ts'],
  ['@dailyuse/authentication/electron', 'packages/authentication/src/electron/index.ts'],
  ['@dailyuse/goal/client', 'packages/goal/src/client/index.ts'],
  ['@dailyuse/goal/electron', 'packages/goal/src/electron/index.ts'],
  ['@dailyuse/goal/schedule-execution', 'packages/goal/src/schedule-execution/index.ts'],
  ['@dailyuse/goal/schedule-projection', 'packages/goal/src/schedule-projection/index.ts'],
  ['@dailyuse/governance/client', 'packages/governance/src/client/index.ts'],
  ['@dailyuse/governance/electron', 'packages/governance/src/electron/index.ts'],
  ['@dailyuse/task/client', 'packages/task/src/client/index.ts'],
  ['@dailyuse/task/electron', 'packages/task/src/electron/index.ts'],
  ['@dailyuse/task/schedule-execution', 'packages/task/src/schedule-execution/index.ts'],
  ['@dailyuse/task/schedule-projection', 'packages/task/src/schedule-projection/index.ts'],
  ['@dailyuse/schedule/client', 'packages/schedule/src/client/index.ts'],
  ['@dailyuse/schedule/electron', 'packages/schedule/src/electron/index.ts'],
  ['@dailyuse/reminder/client', 'packages/reminder/src/client/index.ts'],
  ['@dailyuse/editor/client', 'packages/editor/src/client/index.ts'],
  ['@dailyuse/reminder/electron', 'packages/reminder/src/electron/index.ts'],
  ['@dailyuse/repository/client', 'packages/repository/src/client/index.ts'],
  ['@dailyuse/repository/electron', 'packages/repository/src/electron/index.ts'],
  ['@dailyuse/notification/client', 'packages/notification/src/client/index.ts'],
  ['@dailyuse/notification/electron', 'packages/notification/src/electron/index.ts'],
  ['@dailyuse/setting/client', 'packages/setting/src/client/index.ts'],
  ['@dailyuse/setting/electron', 'packages/setting/src/electron/index.ts'],
  ['@dailyuse/data-portability/client', 'packages/data-portability/src/client/index.ts'],
  ['@dailyuse/data-portability/electron', 'packages/data-portability/src/electron/index.ts'],
  ['@dailyuse/ai/client', 'packages/ai/src/client/index.ts'],
  ['@dailyuse/ai/electron', 'packages/ai/src/electron/index.ts'],
  ['@dailyuse/editor/electron', 'packages/editor/src/electron/index.ts'],
  ['@dailyuse/dashboard', 'packages/dashboard/src/index.ts'],
  ['@dailyuse/ipc-client', 'packages/ipc-client/src/index.ts'],
] as const;
const sharedConfig = createSharedConfig({
  projectRoot: __dirname,
  // The desktop app pulls in Electron-facing modules and workspace aliases
  // that behave more predictably under the Node test environment.
  environment: 'node',
  aliasEntries: [
    { find: /^electron$/, replacement: './test-support/electron.stub.ts' },
    ...createAppVueSourceAliasEntries(__dirname + '/../..'),
    ...createWorkspaceSourceAliasEntries(__dirname + '/../..', desktopTestWorkspaceEntries),
  ],
}) as Record<string, unknown>;

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
    name: 'desktop',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
  },
});
