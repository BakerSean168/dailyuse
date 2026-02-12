# @dailyuse/ui-vue

Vue 3 组件库的**统一聚合导出层** — 业务代码的唯一 UI 导入入口。

## 🎯 架构定位

```
ui-core (纯 TS 逻辑，无头组件)
   ↓
ui-vue-shadcn (Vue 组件 + shadcn 样式)
   ↓
ui-vue (Composables + 聚合导出) ← 你在这里
   ↓
apps/desktop (业务代码)
```

## 💡 核心职责

### 1. **逻辑封装** (Composables)
将 `@dailyuse/ui-core` 的纯 TypeScript 逻辑封装为 Vue 3 的 Composables：

```typescript
// ui-core: 纯逻辑
export function createFormValidator() { /* ... */ }

// ui-vue: Vue 封装
export function useFormValidation() {
  const errors = ref<string[]>([]);
  const validator = createFormValidator();
  return { errors, validate, reset };
}
```

### 2. **组件聚合** (Re-export)
统一导出 `@dailyuse/ui-vue-shadcn` 的所有组件，业务层无需知道底层实现：

```typescript
// ❌ 业务代码不应该这样写
import { Button } from '@dailyuse/ui-vue-shadcn';

// ✅ 应该从统一入口导入
import { Button } from '@dailyuse/ui-vue';
```

**好处：** 未来如果更换组件库（shadcn → Element Plus），只需修改 `ui-vue/src/index.ts` 的导入路径，业务代码无需改动。

## 📦 安装使用

### 安装
```bash
pnpm add @dailyuse/ui-vue
```

### 在应用入口引入样式
```typescript
// apps/desktop/src/main.ts
import '@dailyuse/ui-core/styles/globals.css';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

### 在组件中使用
```vue
<script setup lang="ts">
import { Button, useFormValidation, useColorPicker } from '@dailyuse/ui-vue';

const { errors, validate } = useFormValidation();
const { color, setHex } = useColorPicker();
</script>

<template>
  <Button @click="validate">验证表单</Button>
  <div :style="{ backgroundColor: color }">颜色预览</div>
</template>
```

## 🛠️ 开发指南

### 添加新的 Composable

1. 在 `ui-core` 中实现纯逻辑：
```typescript
// packages/ui-core/src/color-picker.ts
export function createColorPickerCore(options) {
  return {
    hexToRgb(hex: string) { /* ... */ },
    rgbToHex(r, g, b) { /* ... */ }
  };
}
```

2. 在 `ui-vue` 中封装为 Composable：
```typescript
// packages/ui-vue/src/composables/useColorPicker.ts
import { createColorPickerCore } from '@dailyuse/ui-core';
import { ref } from 'vue';

export function useColorPicker() {
  const color = ref('#ffffff');
  const core = createColorPickerCore();
  
  const setHex = (hex: string) => {
    color.value = hex;
  };
  
  return { color, setHex, ...core };
}
```

3. 在 `ui-vue/src/index.ts` 中导出：
```typescript
export { useColorPicker } from './composables/useColorPicker';
```

### 添加新的 shadcn 组件

1. 在 `ui-vue-shadcn` 中生成组件：
```bash
cd packages/ui-vue-shadcn
pnpm dlx shadcn-vue@latest add button
```

2. 在 `ui-vue-shadcn/src/index.ts` 中导出：
```typescript
export * from './components/ui/button';
```

3. **无需在 `ui-vue` 中做任何改动！** 因为 `ui-vue` 已经通过 `export * from '@dailyuse/ui-vue-shadcn'` 自动导出了。

## 📁 目录结构

```
packages/ui-vue/
├── src/
│   ├── composables/          # Vue Composables
│   │   ├── useFormValidation.ts
│   │   ├── useColorPicker.ts
│   │   └── ...
│   └── index.ts              # 统一导出（聚合层）
├── tailwind.config.js        # 继承 ui-core 的 Preset
├── package.json
└── README.md
```

## 🎨 Tailwind 配置

此包的 `tailwind.config.js` 继承自 `ui-core/tailwind.preset.js`：

```javascript
module.exports = {
  presets: [require('../ui-core/tailwind.preset.js')],
  content: [
    'src/**/*.{ts,vue}',
    '../ui-vue-shadcn/src/**/*.{ts,vue}', // 扫描依赖组件
  ],
};
```

**修改主题颜色：** 只需修改 `ui-core/src/styles/globals.css` 中的 CSS 变量，所有组件自动同步。

## 🚀 Storybook

在此包中运行 Storybook 来预览和开发组件：

```bash
pnpm nx run ui-vue:storybook
```

故事文件示例：
```typescript
// src/Button.stories.ts
import { Button } from '@dailyuse/ui-vue-shadcn';

export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = {
  args: {
    variant: 'default',
    children: 'Click me',
  },
};
```

## ❓ 常见问题

### Q: 为什么要有 `ui-vue` 这一层？
**A:** 
- **解耦业务和实现：** 业务代码不直接依赖 `ui-vue-shadcn`，未来可无缝切换底层组件库。
- **逻辑封装：** 提供 Vue 专属的 Composables，而不是让业务代码直接调用 `ui-core` 的函数。
- **统一入口：** 开发者只需记住一个包名 `@dailyuse/ui-vue`。

### Q: 如果我想自定义一个 shadcn 组件怎么办？
**A:** 在 `ui-vue-shadcn/src/components/custom/` 目录创建，不要修改 `ui/` 中的官方组件。

### Q: 为什么 Composables 不直接放在 `ui-core` 中？
**A:** `ui-core` 是框架无关的，可以被 React、Vue、Svelte 共享。而 Composables 是 Vue 专属的（依赖 `ref`、`reactive`），所以放在 `ui-vue` 中。

## 📚 相关包

- [`@dailyuse/ui-core`](../ui-core/README.md) - 纯 TS 逻辑，无头组件
- [`@dailyuse/ui-vue-shadcn`](../ui-vue-shadcn/README.md) - shadcn 样式的 Vue 组件
- [`@dailyuse/ui-react`](../ui-react/README.md) - React 版本的聚合层

---

**记住：** `@dailyuse/ui-vue` 是业务代码的**唯一 UI 导入入口**。从这里导入的所有内容，都经过了精心设计和封装。
