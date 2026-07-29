// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/vue3-vite';
import path, { dirname } from 'path';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    // 当前包 (ui-vue) 的业务组件故事
    '../src/**/*.stories.@(js|jsx|ts|tsx|vue)',
    // 兄弟包 (ui-vue-shadcn) 的原子组件故事
    '../../ui-vue-shadcn/src/**/*.stories.@(js|jsx|ts|tsx|vue)',
  ],

  addons: [getAbsolutePath("@storybook/addon-docs")],

  framework: {
    name: getAbsolutePath("@storybook/vue3-vite"),
    options: {},
  },

  async viteFinal(config) {
    const existingPlugins = config.plugins ?? [];
    const filteredPlugins = existingPlugins.filter((plugin) => {
      const name = typeof plugin === 'object' && plugin && 'name' in plugin ? String(plugin.name) : '';
      return !name.includes('vite:dts');
    });

    const existingAliases = config.resolve?.alias ?? [];

    return {
      ...config,
      plugins: [...filteredPlugins, tailwindcss()],
      resolve: {
        ...config.resolve,
        alias: [
          ...(Array.isArray(existingAliases)
            ? existingAliases
            : Object.entries(existingAliases).map(([find, replacement]) => ({ find, replacement }))),
          {
            find: /[\\/]packages[\\/]utils[\\/]src[\\/]logger[\\/]transports[\\/]FileTransport(\.ts)?$/,
            replacement: path.resolve(__dirname, './mocks/file-transport.ts'),
          },
          {
            find: './transports/FileTransport',
            replacement: path.resolve(__dirname, './mocks/file-transport.ts'),
          },
          {
            find: './transports/FileTransport.ts',
            replacement: path.resolve(__dirname, './mocks/file-transport.ts'),
          },
          // ui-vue-shadcn 内部使用 @/ 作为路径别名
          { find: '@', replacement: path.resolve(__dirname, '../../ui-vue-shadcn/src') },
          // 包级别路径别名（子路径必须在基础路径之前）
          // {
          //   find: '@memoflow/ui-core/styles/globals.css',
          //   replacement: path.resolve(__dirname, '../../ui-core/src/styles/globals.css'),
          // },
          // {
          //   find: '@memoflow/ui-core/theme.css',
          //   replacement: path.resolve(__dirname, '../../ui-core/src/styles/theme.css'),
          // },
          // { find: '@memoflow/ui-core', replacement: path.resolve(__dirname, '../../ui-core/src') },
          // {
          //   find: '@memoflow/ui-vue-shadcn/src/lib/utils',
          //   replacement: path.resolve(__dirname, '../../ui-vue-shadcn/src/lib/utils'),
          // },
          { find: '@memoflow/ui-vue-shadcn', replacement: path.resolve(__dirname, '../../ui-vue-shadcn/src') },
          { find: '@memoflow/ui-vue', replacement: path.resolve(__dirname, '../src') },
          // task 模块及其依赖
          { find: '@memoflow/task/domain-client', replacement: path.resolve(__dirname, '../../task/src/domain-client') },
          { find: '@memoflow/task', replacement: path.resolve(__dirname, '../../task/src') },
          { find: '@memoflow/contracts/task', replacement: path.resolve(__dirname, '../../contracts/src/task') },
          { find: '@memoflow/contracts/shared', replacement: path.resolve(__dirname, '../../contracts/src/shared') },
          {
            find: '@memoflow/contracts/primitives',
            replacement: path.resolve(__dirname, '../../contracts/src/primitives'),
          },
          { find: '@memoflow/contracts', replacement: path.resolve(__dirname, '../../contracts/src') },
          { find: '@memoflow/goal/domain-shared', replacement: path.resolve(__dirname, '../../goal/src/domain-shared') },
          { find: '@memoflow/domain-shared', replacement: path.resolve(__dirname, '../../domain-shared/src') },
          { find: '@memoflow/utils', replacement: path.resolve(__dirname, '../../utils/src') },
        ],
      },
      build: {
        ...(config.build ?? {}),
        // 避免 esbuild 对某些 Storybook 生成选择器产生无关告警
        cssMinify: 'lightningcss',
        // Storybook 文档站会打入较大 chunk，放宽阈值避免无价值噪音
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          ...(config.build?.rollupOptions ?? {}),
          onwarn(warning, warn) {
            const fromStorybookRuntime =
              typeof warning.id === 'string' &&
              warning.id.includes('@storybook/core/dist/preview/runtime.js');
            if (warning.code === 'EVAL' && fromStorybookRuntime) {
              return;
            }
            if (typeof config.build?.rollupOptions?.onwarn === 'function') {
              config.build.rollupOptions.onwarn(warning, warn);
              return;
            }
            warn(warning);
          },
        },
      },
    };
  }
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
