/**
 * @dailyuse/ui-vue - Tailwind CSS Configuration
 *
 * 继承 ui-core 的 Tailwind Preset，仅配置内容扫描路径。
 * 此文件用于 IDE 智能提示和 Storybook 预览。
 * 
 * 此包是聚合层，会扫描自身代码和依赖的 ui-vue-shadcn 组件。
 */
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 继承核心设计系统配置
  presets: [require('../ui-core/tailwind.preset.js')],

  // 扫描当前包和依赖包的文件
  content: [
    join(__dirname, 'src/**/*.{ts,vue,js}'),
    // 扫描 ui-vue-shadcn 的组件（确保 Tailwind 能识别其中的类）
    join(__dirname, '../ui-vue-shadcn/src/**/*.{ts,vue,js}'),
  ],
};
