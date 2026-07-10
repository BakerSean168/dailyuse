import { baseLibraryConfig, createLocalOnlyDtsPaths } from '../../tools/build/tsup.base.config.ts';

const config = baseLibraryConfig('@dailyuse/dashboard');

const dtsConfig = createLocalOnlyDtsPaths();

export default {
  ...config,
  entry: ['src/index.ts'],
  // 固定 DTS 编译根为 ./src。dashboard 再导出 @dailyuse/contracts/dashboard，其产物
  // 里 dashboard-data.dto → ../../goal/value-objects/goal-status 是跨子路径相对 import，
  // rollup-plugin-dts 追进去后无法定位 contracts package.json export map 的根，报
  // TS2209「project root is ambiguous」。显式 rootDir 消歧（仅本包需要，不放进共享 helper
  // 以免影响 DTS 会追进 workspace 源码的包，如 schedule-orchestration）。
  dts: {
    ...dtsConfig,
    compilerOptions: {
      ...dtsConfig.compilerOptions,
      rootDir: './src',
    },
  },
};
