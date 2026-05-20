import { baseLibraryConfig, createLocalOnlyDtsPaths } from '../../tools/build/tsup.base.config.ts';

const config = baseLibraryConfig('@dailyuse/dashboard');

export default {
  ...config,
  entry: ['src/index.ts'],
  dts: createLocalOnlyDtsPaths(),
};
