import { createTsupConfig } from '../../tools/build/tsup.base.config.ts';

export default createTsupConfig({
  packageName: '@memoflow/powersync-schema',
  external: ['@powersync/common'],
});
