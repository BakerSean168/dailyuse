# Custom Components (custom/)

✅ **这是你的自定义组件目录** ✅

## 说明

此目录用于存放所有自定义的 Vue 组件，组件分为两类：

1. **pure-ui**: 通用 UI 组件（跨模块复用）
2. **domain-business**: 业务领域 UI 组件（如 goal/task）

> 两类组件都必须是 **纯展示层（presentational）**：仅通过 props 输入 + emits 输出。

## 开发指南

### 1. 组件命名规范

使用 PascalCase，清晰描述组件用途：

```
✅ ColorPicker.vue
✅ DataTable.vue
✅ SearchBar.vue
❌ picker.vue
❌ my-component.vue
```

### 2. 引用官方组件

从 `../ui/` 导入官方 shadcn 组件：

```vue
<script setup lang="ts">
import { Button } from '../ui/button';
import { Input } from '../ui/input';
</script>
```

### 3. 架构边界（强制）

- ✅ 允许：接收 props、派发 emits、组合 `ui/` 组件
- ✅ 允许：`domain-business` 组件导入 `@dailyuse/contracts` 类型作为 props 类型
- ❌ 禁止：Pinia、全局状态工具、任何 store/composable 状态管理
- ❌ 禁止：API 调用、持久化操作、路由跳转副作用
- ❌ 禁止：在组件内部直接编排业务流程

容器逻辑（状态管理、API、路由、副作用）必须放在 `apps/*` 页面层或上层容器组件中。

### 4. 使用 ui-core 逻辑

对于复杂逻辑，从 `@dailyuse/ui-core` 导入：

```vue
<script setup lang="ts">
import { createColorPickerCore } from '@dailyuse/ui-core';
import { ref, onMounted } from 'vue';

const color = ref('#ffffff');
const core = createColorPickerCore({ /* ... */ });
</script>
```

### 5. 样式规范

- 使用 Tailwind CSS 类
- 遵循 `ui-core` 中定义的设计 Token
- 使用 CSS 变量（如 `hsl(var(--primary))`）

### 6. 导出组件

在 `../../index.ts` 中统一导出：

```typescript
// src/index.ts
export * from './components/custom/ColorPicker.vue';
export * from './components/custom/DataTable.vue';
```

## 示例结构

```
custom/
├── ColorPicker/
│   ├── ColorPicker.vue
│   ├── ColorPickerSlider.vue
│   └── index.ts
├── DataTable/
│   ├── DataTable.vue
│   ├── DataTableHeader.vue
│   ├── DataTableRow.vue
│   └── index.ts
└── README.md (本文件)
```

## 架构定位

```
ui-core (纯逻辑)
    ↓
ui-vue-shadcn/ui/ (官方组件)
    ↓
ui-vue-shadcn/custom/ ← 你在这里
    ↓
ui-vue (封装 + 聚合)
    ↓
apps/desktop (业务代码)
```

---

**记住：** 这里是"皮肤"层，专注于组件的**视觉呈现**和**用户交互**，复杂的业务逻辑应该在 `ui-core` 或 `ui-vue` 中处理。

## 提交检查清单

- [ ] 组件在文档/PR 中标记为 `pure-ui` 或 `domain-business`
- [ ] 仅使用 props + emits 交互
- [ ] 不依赖 Pinia/全局状态工具
- [ ] 不包含 API/路由/持久化副作用
