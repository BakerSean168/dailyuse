/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';
import path from 'node:path';

const contractsSrc = path.resolve(__dirname, '../../packages/contracts/src');

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
    aliases: {
      '@dailyuse/domain-shared': '../../packages/domain-shared/src',
      '@dailyuse/database': '../../packages/database/src',
    },
  }),
  defineConfig({
    resolve: {
      alias: [
        // @dailyuse/test-utils subpath imports
        {
          find: /^@dailyuse\/test-utils\/(.+)/,
          replacement: path.resolve(__dirname, '../../packages/test-utils/src/$1'),
        },
        {
          find: '@dailyuse/test-utils',
          replacement: path.resolve(__dirname, '../../packages/test-utils/src/index.ts'),
        },
        // @dailyuse/contracts subpath imports (specific before catch-all)
        {
          find: '@dailyuse/contracts/primitives',
          replacement: path.resolve(contractsSrc, 'primitives/index.ts'),
        },
        {
          find: '@dailyuse/contracts/shared',
          replacement: path.resolve(contractsSrc, 'shared/index.ts'),
        },
        {
          find: '@dailyuse/contracts/result',
          replacement: path.resolve(contractsSrc, 'result/index.ts'),
        },
        {
          find: /^@dailyuse\/contracts\/(.+)/,
          replacement: path.resolve(contractsSrc, 'modules/$1/index.ts'),
        },
      ],
    },
    test: {
      name: 'notification',
      testTimeout: 10000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: false,
        },
      },
    },
  }),
);
