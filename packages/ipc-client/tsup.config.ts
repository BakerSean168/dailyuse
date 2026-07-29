/**
 * @memoflow/ipc-client 打包配置
 *
 * 包类型：IPC 客户端共享内核
 * 打包工具：tsup (基于 esbuild)
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config.ts';

const config = baseLibraryConfig('@memoflow/ipc-client');

export default {
  ...config,
  entry: ['src/index.ts'],
};
