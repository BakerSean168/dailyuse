import { createPackageVitestConfig } from '../../vitest.shared';

export default createPackageVitestConfig({
  projectRoot: __dirname,
  environment: 'node',
  name: 'cloud-auth',
  testInclude: ['src/**/*.spec.ts'],
});
