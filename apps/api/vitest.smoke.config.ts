/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import {
  domainResolveAtAlias,
  taskDeepImportResolver,
  taskResolveAliases,
} from '../../vitest.workspace-helpers';

export default defineConfig({
  plugins: [taskDeepImportResolver, domainResolveAtAlias],
  resolve: {
    alias: [
      {
        find: /^@\/(.+)/,
        replacement: path.resolve(__dirname, '../../packages/task/src/$1'),
      },
      {
        find: '@dailyuse/task/controllers/task-template.controller',
        replacement: path.resolve(
          __dirname,
          '../../packages/task/src/controllers/task-template.controller.ts',
        ),
      },
      {
        find: '@dailyuse/task/controllers/task-instance.controller',
        replacement: path.resolve(
          __dirname,
          '../../packages/task/src/controllers/task-instance.controller.ts',
        ),
      },
      {
        find: '@dailyuse/task/api/routes',
        replacement: path.resolve(__dirname, '../../packages/task/src/api/routes/index.ts'),
      },
      ...taskResolveAliases,
    ],
  },
  test: {
    name: 'api-smoke',
    root: __dirname,
    globals: true,
    environment: 'node',
    include: ['src/__tests__/smoke/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    testTimeout: 15000,
  },
});
