import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';
import { createWorkspaceSourceAliasEntries } from '../../vite.workspace-aliases';

const desktopTestWorkspaceEntries = [
  ['@dailyuse/account/application-client', 'packages/account/src/application-client/index.ts'],
  ['@dailyuse/account/infrastructure-client', 'packages/account/src/infrastructure-client/index.ts'],
  ['@dailyuse/account/electron-entry', 'packages/account/src/electron-entry/index.ts'],
  [
    '@dailyuse/authentication/application-client',
    'packages/authentication/src/application-client/index.ts',
  ],
  [
    '@dailyuse/authentication/infrastructure-client',
    'packages/authentication/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/goal/application-client', 'packages/goal/src/application-client/index.ts'],
  ['@dailyuse/goal/infrastructure-client', 'packages/goal/src/infrastructure-client/index.ts'],
  ['@dailyuse/goal/electron-entry', 'packages/goal/src/electron-entry/index.ts'],
  [
    '@dailyuse/governance/application-client',
    'packages/governance/src/application-client/index.ts',
  ],
  [
    '@dailyuse/governance/infrastructure-client',
    'packages/governance/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/governance/electron-entry', 'packages/governance/src/electron-entry/index.ts'],
  ['@dailyuse/task/application-client', 'packages/task/src/application-client/index.ts'],
  ['@dailyuse/task/infrastructure-client', 'packages/task/src/infrastructure-client/index.ts'],
  ['@dailyuse/task/electron-entry', 'packages/task/src/electron-entry/index.ts'],
  ['@dailyuse/schedule/application-client', 'packages/schedule/src/application-client/index.ts'],
  [
    '@dailyuse/schedule/infrastructure-client',
    'packages/schedule/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/schedule/electron-entry', 'packages/schedule/src/electron-entry/index.ts'],
  ['@dailyuse/reminder/application-client', 'packages/reminder/src/application-client/index.ts'],
  [
    '@dailyuse/reminder/infrastructure-client',
    'packages/reminder/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/reminder/electron-entry', 'packages/reminder/src/electron-entry/index.ts'],
  [
    '@dailyuse/repository/application-client',
    'packages/repository/src/application-client/index.ts',
  ],
  [
    '@dailyuse/repository/infrastructure-client',
    'packages/repository/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/repository/electron-entry', 'packages/repository/src/electron-entry/index.ts'],
  [
    '@dailyuse/notification/application-client',
    'packages/notification/src/application-client/index.ts',
  ],
  [
    '@dailyuse/notification/infrastructure-client',
    'packages/notification/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/notification/electron-entry', 'packages/notification/src/electron-entry/index.ts'],
  ['@dailyuse/setting/application-client', 'packages/setting/src/application-client/index.ts'],
  ['@dailyuse/setting/infrastructure-client', 'packages/setting/src/infrastructure-client/index.ts'],
  ['@dailyuse/setting/electron-entry', 'packages/setting/src/electron-entry/index.ts'],
  ['@dailyuse/ai/application-client', 'packages/ai/src/application-client/index.ts'],
  ['@dailyuse/ai/infrastructure-client', 'packages/ai/src/infrastructure-client/index.ts'],
  ['@dailyuse/ai/electron-entry', 'packages/ai/src/electron-entry/index.ts'],
  ['@dailyuse/editor/electron-entry', 'packages/editor/src/electron-entry/index.ts'],
  ['@dailyuse/app-vue', 'packages/app-vue/src/index.ts'],
  ['@dailyuse/dashboard', 'packages/dashboard/src/index.ts'],
  ['@dailyuse/ipc-client', 'packages/ipc-client/src/index.ts'],
] as const;

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
    aliasEntries: createWorkspaceSourceAliasEntries(
      __dirname + '/../..',
      desktopTestWorkspaceEntries,
    ),
  }),
  defineConfig({
    root: __dirname,
    test: {
      name: 'desktop',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'node',
    },
  }),
);
