/**
 * @dailyuse/domain-shared 打包配置
 *
 * 包类型：共享域模型库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - 跨平台共享域模型
 * - tsup 对跨平台支持好
 * - 支持 tree-shaking 和代码分割
 */

import { createTsupConfig } from '../../tools/build/tsup.base.config';

export default createTsupConfig({
  packageName: '@dailyuse/domain-shared',
  entry: [
    // 根入口
    'src/index.ts',
    // 模块子路径入口
    'src/account/index.ts',
    'src/ai/index.ts',
    'src/authentication/index.ts',
    'src/editor/index.ts',
    'src/example/index.ts',
    'src/goal/index.ts',
    'src/notification/index.ts',
    'src/reminder/index.ts',
    'src/repository/index.ts',
    'src/schedule/index.ts',
    'src/setting/index.ts',
    'src/shared/index.ts',
    'src/sync/index.ts',
    'src/task/index.ts'
  ],
  external: ['@dailyuse/contracts', '@dailyuse/utils'],
  extraOptions: {
    // 启用 DTS 生成类型声明文件
    dts: true,
  },
});