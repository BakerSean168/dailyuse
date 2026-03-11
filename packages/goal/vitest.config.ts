/// <reference types="vitest" />
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

const sharedConfig = createSharedConfig({
  projectRoot: __dirname,
  environment: 'node',
  aliases: {
    '@/domain-server': './src/domain-server/index.ts',
    '@/domain-shared': './src/domain-shared/index.ts',
    '@dailyuse/contracts/goal': '../contracts/src/modules/goal/index.ts',
    '@dailyuse/contracts/modules/task': '../contracts/src/modules/task/index.ts',
    '@dailyuse/contracts/task': '../contracts/src/modules/task/index.ts',
    '@dailyuse/contracts/result': '../contracts/src/result/index.ts',
    '@dailyuse/contracts/shared': '../contracts/src/shared/index.ts',
    '@dailyuse/contracts/primitives': '../contracts/src/primitives/index.ts',
    '@dailyuse/contracts/electron': '../contracts/src/electron/index.ts',
    '@dailyuse/test-utils': '../test-utils/src/index.ts',
    '@dailyuse/test-utils/mocks': '../test-utils/src/mocks/index.ts',
    '@dailyuse/test-utils/helpers/result-matchers': '../test-utils/src/helpers/result-matchers.ts',
    '@dailyuse/test-utils/fixtures': '../test-utils/src/fixtures/index.ts',
    '@dailyuse/task/domain-server': '../task/src/domain-server/index.ts',
    '@dailyuse/task/domain-shared': '../task/src/domain-shared/index.ts',
    '@dailyuse/domain-shared': '../../packages/domain-shared/src',
    '@dailyuse/database': '../../packages/database/src',
  },
}) as UserConfig;

const projectConfig = defineConfig({
  root: __dirname,
  test: {
    name: 'goal',
    testTimeout: 10000,
    pool: 'forks',
  },
}) as UserConfig;

export default mergeConfig(sharedConfig, projectConfig);
