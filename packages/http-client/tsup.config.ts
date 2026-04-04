/**
 * @dailyuse/http-client 打包配置
 *
 * 包类型：HTTP 客户端共享内核
 * 打包工具：tsup (基于 esbuild)
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config.ts';

const config = baseLibraryConfig('@dailyuse/http-client');

export default {
  ...config,
  entry: ['src/index.ts'],
  // Override DTS to avoid TS6059 rootDir resolution issues
  // when TypeScript follows path mappings to other packages' source files
  dts: {
    compilerOptions: {
      paths: {},
    },
  },
  external: [
    ...(config.external || []),
    'axios',
  ],
};
