# Custom Components (custom/)

✅ **这是你的自定义组件目录** ✅

## 说明

此目录用于存放所有自定义的 Vue 组件，这些组件可能：

1. **组合官方组件**: 例如使用 `ui/` 中的 `Button` 和 `Input` 创建 `SearchBar`
2. **完全自定义**: 例如 `ColorPicker`、`DataTable`、`RichTextEditor`
3. **业务特定**: 例如 `UserAvatar`、`NotificationBadge`

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

### 3. 使用 ui-core 逻辑

对于复杂逻辑，从 `@dailyuse/ui-core` 导入：

```vue
<script setup lang="ts">
import { createColorPickerCore } from '@dailyuse/ui-core';
import { ref, onMounted } from 'vue';

const color = ref('#ffffff');
const core = createColorPickerCore({ /* ... */ });
</script>
```

### 4. 样式规范

- 使用 Tailwind CSS 类
- 遵循 `ui-core` 中定义的设计 Token
- 使用 CSS 变量（如 `hsl(var(--primary))`）

### 5. 导出组件

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
