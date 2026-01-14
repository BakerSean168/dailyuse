/**
 * @dailyuse/domain-server 打包配置
 *
 * 包类型：服务端域模型库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - Node.js 环境下的域模型
 * - tsup 对 Node.js 支持好
 * - 支持 tree-shaking 和代码分割
 */

import { createTsupConfig } from '../../tools/build/tsup.base.config';

export default createTsupConfig({
  packageName: '@dailyuse/domain-server',
  entry: [
    // 根入口
    'src/index.ts',
    // 模块子路径入口
    'src/task/index.ts',
    'src/goal/index.ts',
    'src/reminder/index.ts',
    'src/schedule/index.ts',
    'src/notification/index.ts',
    'src/repository/index.ts',
    'src/account/index.ts',
    'src/authentication/index.ts',
    'src/setting/index.ts',
    'src/dashboard/index.ts',
    'src/editor/index.ts',
    'src/ai/index.ts',
    'src/sync/index.ts',
  ],
  external: ['@dailyuse/contracts', '@dailyuse/utils'],
  extraOptions: {
    // 启用 DTS 生成类型声明文件
    dts: true,
  },
});
