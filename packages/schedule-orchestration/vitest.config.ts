/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
    aliasEntries: [
      {
        find: /^@dailyuse\/task\/schedule-projection$/,
        replacement: path.resolve(
          __dirname,
          '../task/src/server/infrastructure/schedule-projection-source.ts',
        ),
      },
      {
        find: /^@dailyuse\/goal\/schedule-projection$/,
        replacement: path.resolve(
          __dirname,
          '../goal/src/server/infrastructure/schedule-projection-source.ts',
        ),
      },
      {
        find: /^@dailyuse\/reminder\/schedule-projection$/,
        replacement: path.resolve(
          __dirname,
          '../reminder/src/server/infrastructure/schedule-projection-source.ts',
        ),
      },
      {
        find: /^@\/server\/(.+)/,
        replacement: path.resolve(__dirname, '../schedule/src/server/$1'),
      },
    ],
  }),
  defineConfig({
    test: {
      name: 'schedule-orchestration',
      root: __dirname,
      testTimeout: 10000,
      pool: 'forks',
    },
  }),
);
