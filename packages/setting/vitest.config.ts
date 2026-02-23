/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const contractsRoot = path.resolve(root, 'packages/contracts/src');
const utilsRoot = path.resolve(root, 'packages/utils/src');
const settingSrc = path.resolve(__dirname, 'src');

export default defineConfig({
  resolve: {
    alias: [
      // Contracts subpath aliases (specific first)
      { find: '@dailyuse/contracts/primitives', replacement: path.join(contractsRoot, 'primitives/index.ts') },
      { find: '@dailyuse/contracts/setting', replacement: path.join(contractsRoot, 'modules/setting/index.ts') },
      { find: '@dailyuse/contracts/result', replacement: path.join(contractsRoot, 'result/index.ts') },
      { find: '@dailyuse/contracts/shared', replacement: path.join(contractsRoot, 'shared/index.ts') },
      { find: '@dailyuse/contracts/mocks', replacement: path.join(contractsRoot, 'mocks/index.ts') },
      { find: '@dailyuse/contracts', replacement: path.join(contractsRoot, 'index.ts') },
      // Utils
      { find: '@dailyuse/utils/result', replacement: path.join(utilsRoot, 'result/index.ts') },
      { find: '@dailyuse/utils', replacement: path.join(utilsRoot, 'index.ts') },
      // Other packages
      { find: '@dailyuse/database', replacement: path.resolve(root, 'packages/database/src/index.ts') },
      { find: '@dailyuse/domain-shared/shared', replacement: path.resolve(root, 'packages/domain-shared/src/shared/index.ts') },
      { find: '@dailyuse/domain-shared', replacement: path.resolve(root, 'packages/domain-shared/src/index.ts') },
      // Resolve @/ for contracts package files (which use @/primitives etc.)
      // This must be a regex that matches the contracts source directory
      { find: /^@\/primitives(.*)/, replacement: path.join(contractsRoot, 'primitives$1') },
      // Setting package @/ alias (catch-all)
      { find: /^@\/(.*)/, replacement: path.join(settingSrc, '$1') },
    ],
  },
  test: {
    name: 'setting',
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    passWithNoTests: true,
    include: ['packages/setting/src/**/*.{test,spec}.{js,ts}'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
});
