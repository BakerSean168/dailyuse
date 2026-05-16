import { createTsupConfig } from '../../tools/build/tsup.base.config.ts';

export default createTsupConfig({
  packageName: '@dailyuse/powersync-schema',
  external: ['@powersync/common'],
});
