import { baseLibraryConfig, createLocalOnlyDtsPaths } from '../../tools/build/tsup.base.config.ts';

const config = baseLibraryConfig('@dailyuse/time');

export default {
  ...config,
  entry: ['src/index.ts'],
  external: [...(config.external || []), '@dailyuse/contracts', 'date-fns'],
  dts: createLocalOnlyDtsPaths(),
};
