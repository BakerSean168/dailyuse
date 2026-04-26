/// <reference types="vitest" />
import path from 'node:path';
import { createPackageVitestConfig } from '../../vitest.shared';

const workspaceRoot = path.resolve(__dirname, '../..');
const contractsRoot = path.resolve(workspaceRoot, 'packages/contracts/src');

export default createPackageVitestConfig({
  projectRoot: __dirname,
  environment: 'node',
  name: 'setting',
  governedCoverage: true,
  aliasEntries: [
    {
      find: /^@\/primitives(.*)/,
      replacement: path.join(contractsRoot, 'primitives$1'),
    },
  ],
});
