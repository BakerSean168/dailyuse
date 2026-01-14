/**
 * @dailyuse/domain-client 打包配置
 *
 * 包类型：前端域模型库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - 前端域模型，需要优秀的 tree-shaking
 * - tsup 打包速度快，支持代码分割
 * - 支持 ESM 格式，适合现代前端
 */

import { createTsupConfig } from '../../tools/build/tsup.base.config';

export default createTsupConfig({
  packageName: '@dailyuse/domain-client',
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
  // 启用 DTS 生成
  extraOptions: {
    dts: true,
  },
});

