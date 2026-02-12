# 联邦 UI 架构 - 快速参考

## 🎯 核心原则

> **"写逻辑先写大脑，画组件先画皮肤，用组件只看神经"**

- **ui-core** = 大脑（纯 TS 逻辑）
- **ui-vue-shadcn** = 皮肤（Vue 组件 + 样式）
- **ui-vue** = 神经（Composables + 聚合）

## ⚡ 常见场景速查

### 场景 1: 添加一个 shadcn 官方组件（如 Button）

```bash
# 1. 生成组件
cd packages/ui-vue-shadcn
pnpm dlx shadcn-vue@latest add button

# 2. 导出组件
# 编辑 packages/ui-vue-shadcn/src/index.ts
export * from './components/ui/button';

# 3. 在业务代码中使用
# apps/desktop/src/App.vue
import { Button } from '@dailyuse/ui-vue';
```

**时间：** ~2 分钟

---

### 场景 2: 创建自定义组合组件（如 SearchBar）

```bash
# 1. 创建组件文件
# packages/ui-vue-shadcn/src/components/custom/SearchBar.vue
```

```vue
<script setup lang="ts">
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search } from 'lucide-vue-next';

defineProps<{
  placeholder?: string;
}>();

const emit = defineEmits<{
  search: [value: string];
}>();
</script>

<template>
  <div class="flex gap-2">
    <Input :placeholder="placeholder" @keyup.enter="emit('search', $event.target.value)" />
    <Button><Search class="w-4 h-4" /></Button>
  </div>
</template>
```

```typescript
// 2. 导出组件
// packages/ui-vue-shadcn/src/index.ts
export * from './components/custom/SearchBar.vue';

// 3. 使用
import { SearchBar } from '@dailyuse/ui-vue';
```

**时间：** ~10 分钟

---

### 场景 3: 开发带复杂逻辑的组件（如 ColorPicker）

#### 第一步：在 ui-core 写逻辑（5 分钟）
```typescript
// packages/ui-core/src/color-picker.ts
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
```

#### 第二步：在 ui-vue-shadcn 写 UI（10 分钟）
```vue
<!-- packages/ui-vue-shadcn/src/components/custom/ColorPicker.vue -->
<script setup lang="ts">
import { Slider } from '../ui/slider';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="space-y-2">
    <div class="w-full h-20 rounded" :style="{ backgroundColor: modelValue }" />
    <Slider :model-value="[0]" :max="255" @update:model-value="/* ... */" />
  </div>
</template>
```

#### 第三步：在 ui-vue 封装 Composable（5 分钟）
```typescript
// packages/ui-vue/src/composables/useColorPicker.ts
import { hexToRgb, rgbToHex } from '@dailyuse/ui-core';
import { ref, computed } from 'vue';

export function useColorPicker(initialColor = '#ffffff') {
  const color = ref(initialColor);
  
  const rgb = computed(() => hexToRgb(color.value));
  
  const setRgb = (r: number, g: number, b: number) => {
    color.value = rgbToHex(r, g, b);
  };
  
  return { color, rgb, setRgb };
}
```

```typescript
// packages/ui-vue/src/index.ts
export { useColorPicker } from './composables/useColorPicker';
```

#### 第四步：业务代码使用（2 分钟）
```vue
<script setup lang="ts">
import { ColorPicker, useColorPicker } from '@dailyuse/ui-vue';

const { color, setRgb } = useColorPicker('#4287f5');
</script>

<template>
  <ColorPicker v-model="color" @change="setRgb" />
</template>
```

**总时间：** ~22 分钟

---

### 场景 4: 修改全局主题色

```css
/* packages/ui-core/src/styles/globals.css */
:root {
  --primary: 221.2 83.2% 53.3%;  /* 从蓝色 */
  --primary: 270 80% 60%;        /* 改为紫色 */
}
```

**时间：** ~30 秒  
**影响范围：** 所有应用和组件自动同步 ✨

---

### 场景 5: 修改某个组件的样式（如按钮圆角）

#### ❌ 错误做法
```vue
<!-- 不要修改官方组件源码！ -->
<!-- packages/ui-vue-shadcn/src/components/ui/button/Button.vue -->
<button class="rounded-xl"> <!-- 不要这样改 -->
```

#### ✅ 正确做法 1：修改全局 Token
```css
/* packages/ui-core/src/styles/globals.css */
:root {
  --radius: 0.5rem;  /* 从 0.5rem 改为 1rem */
}
```

#### ✅ 正确做法 2：创建自定义变体
```vue
<!-- packages/ui-vue-shadcn/src/components/custom/RoundButton.vue -->
<script setup lang="ts">
import { Button } from '../ui/button';
</script>

<template>
  <Button class="rounded-xl">
    <slot />
  </Button>
</template>
```

**时间：** ~2 分钟

---

### 场景 6: 为现有组件添加 Vue 特有功能（如自动聚焦）

```typescript
// packages/ui-vue/src/composables/useAutoFocus.ts
import { onMounted, ref } from 'vue';

export function useAutoFocus() {
  const elementRef = ref<HTMLElement | null>(null);
  
  onMounted(() => {
    elementRef.value?.focus();
  });
  
  return { elementRef };
}
```

```typescript
// packages/ui-vue/src/index.ts
export { useAutoFocus } from './composables/useAutoFocus';
```

```vue
<!-- 业务代码 -->
<script setup lang="ts">
import { Input, useAutoFocus } from '@dailyuse/ui-vue';

const { elementRef } = useAutoFocus();
</script>

<template>
  <Input ref="elementRef" />
</template>
```

**时间：** ~5 分钟

---

## 🛠️ 工具命令速查

```bash
# 安装依赖
pnpm install

# 构建 UI 包
pnpm nx run-many -t build --projects=ui-core,ui-vue-shadcn,ui-vue

# 运行 Storybook（推荐在 ui-vue 层）
pnpm nx run ui-vue:storybook

# 添加 shadcn 组件
cd packages/ui-vue-shadcn
pnpm dlx shadcn-vue@latest add <component-name>

# 查看可用的 shadcn 组件
pnpm dlx shadcn-vue@latest add
```

---

## 📦 导入路径对照表

| 你想要... | 从哪里导入 | 示例 |
|----------|----------|------|
| UI 组件 | `@dailyuse/ui-vue` | `import { Button } from '@dailyuse/ui-vue'` |
| Composables | `@dailyuse/ui-vue` | `import { useFormValidation } from '@dailyuse/ui-vue'` |
| 工具函数 | `@dailyuse/ui-vue` | `import { hexToRgb } from '@dailyuse/ui-vue'` |
| CSS 变量 | `@dailyuse/ui-core` | `import '@dailyuse/ui-core/styles/globals.css'` |

**记住：** 业务代码 99% 的情况只需要 `@dailyuse/ui-vue` 这一个导入！

---

## 🚫 常见错误

### ❌ 错误 1: 直接导入 shadcn 包
```typescript
// ❌ 不要这样
import { Button } from '@dailyuse/ui-vue-shadcn';

// ✅ 应该这样
import { Button } from '@dailyuse/ui-vue';
```

### ❌ 错误 2: 修改官方组件源码
```bash
# ❌ 不要修改这个目录的文件
packages/ui-vue-shadcn/src/components/ui/

# ✅ 应该在这里创建自定义组件
packages/ui-vue-shadcn/src/components/custom/
```

### ❌ 错误 3: 在多个地方定义颜色
```css
/* ❌ 不要在每个应用中定义 */
apps/desktop/src/styles.css
apps/web/src/styles.css

/* ✅ 应该在 ui-core 统一定义 */
packages/ui-core/src/styles/globals.css
```

---

## 🎓 学习路径

### 新手开发者（第 1-3 天）
1. 只使用现成组件：从 `@dailyuse/ui-vue` 导入
2. 组合现成组件：在 `ui-vue-shadcn/custom/` 创建新组件
3. 使用 Composables：从 `@dailyuse/ui-vue` 导入 `useXxx`

### 进阶开发者（第 4-7 天）
1. 添加 shadcn 官方组件
2. 创建自定义 Composables
3. 修改全局主题

### 架构师（第 8+ 天）
1. 在 ui-core 中实现复杂逻辑
2. 设计新的设计 Token
3. 优化构建配置和 Storybook

---

## 💡 提示与技巧

### 提示 1: 使用 Tailwind IntelliSense
确保 VS Code 安装了 `Tailwind CSS IntelliSense` 插件，并且每个包都有 `tailwind.config.js`。

### 提示 2: 利用 Storybook 进行组件开发
在 `ui-vue` 中运行 Storybook，可以实时预览组件：
```bash
pnpm nx run ui-vue:storybook
```

### 提示 3: 使用 TypeScript 类型推导
所有 Composables 都有完整的 TypeScript 类型：
```typescript
const { errors, validate } = useFormValidation();
//    ^? errors: Ref<string[]>
//       validate: (rules: ValidationRules) => boolean
```

### 提示 4: 查看 React 版本作为参考
如果不确定如何实现，可以查看 `ui-react` 和 `ui-react-shadcn` 的对应实现。

---

**记住这个咒语：**  
> "大脑（ui-core）想，皮肤（ui-vue-shadcn）画，神经（ui-vue）连，身体（apps）用。"

Happy coding! 🚀
