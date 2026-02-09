/**
 * @dailyuse/http-client 打包配置
 *
 * 包类型：HTTP 客户端共享内核
 * 打包工具：tsup (基于 esbuild)
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config';

const config = baseLibraryConfig('@dailyuse/http-client');

export default {
  ...config,
  entry: ['src/index.ts'],
  external: [
    ...(config.external || []),
    'axios',
  ],
};
