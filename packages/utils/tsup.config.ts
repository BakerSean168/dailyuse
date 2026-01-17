/**
 * @dailyuse/utils 打包配置
 *
 * 包类型：工具函数库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - 工具函数需要最小化体积
 * - tsup 支持优秀的 tree-shaking
 * - 打包速度快，适合频繁修改
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config';

const config = baseLibraryConfig('@dailyuse/utils');

export default {
  ...config,
  entry: ['src/index.ts', 'src/winston.ts', 'src/validation/index.ts'],
  external: [...(config.external || []), 'winston', 'winston-daily-rotate-file', '@dailyuse/contracts'],
  dts: {
    resolve: true,  // ✅ 启用 DTS 生成，自动解析类型路径
    compilerOptions: {
      paths: {
        '@dailyuse/contracts': ['../contracts/src'],
        '@dailyuse/contracts/*': ['../contracts/src/*'],
      },
    },
  },
};

