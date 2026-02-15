import type { StorybookConfig } from '@storybook/vue3-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    // 当前包 (ui-vue) 的业务组件故事
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|vue)',
    // 兄弟包 (ui-vue-shadcn) 的原子组件故事
    '../../ui-vue-shadcn/src/**/*.stories.@(js|jsx|ts|tsx|vue)',
  ],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          // ui-vue-shadcn 内部使用 @/ 作为路径别名
          '@': path.resolve(__dirname, '../../ui-vue-shadcn/src'),
          // 包级别路径别名（子路径必须在基础路径之前）
          '@dailyuse/ui-core/styles/globals.css': path.resolve(__dirname, '../../ui-core/src/styles/globals.css'),
          '@dailyuse/ui-core': path.resolve(__dirname, '../../ui-core/src'),
          '@dailyuse/ui-vue-shadcn/src/lib/utils': path.resolve(__dirname, '../../ui-vue-shadcn/src/lib/utils'),
          '@dailyuse/ui-vue-shadcn': path.resolve(__dirname, '../../ui-vue-shadcn/src'),
          '@dailyuse/ui-vue': path.resolve(__dirname, '../src'),
          // task 模块及其依赖
          '@dailyuse/task/domain-client': path.resolve(__dirname, '../../task/src/domain-client'),
          '@dailyuse/task': path.resolve(__dirname, '../../task/src'),
          '@dailyuse/contracts/task': path.resolve(__dirname, '../../contracts/src/task'),
          '@dailyuse/contracts/shared': path.resolve(__dirname, '../../contracts/src/shared'),
          '@dailyuse/contracts/primitives': path.resolve(__dirname, '../../contracts/src/primitives'),
          '@dailyuse/contracts': path.resolve(__dirname, '../../contracts/src'),
          '@dailyuse/domain-shared/goal': path.resolve(__dirname, '../../domain-shared/src/goal'),
          '@dailyuse/domain-shared': path.resolve(__dirname, '../../domain-shared/src'),
          '@dailyuse/utils': path.resolve(__dirname, '../../utils/src'),
        },
      },
    };
  },
};

export default config;
