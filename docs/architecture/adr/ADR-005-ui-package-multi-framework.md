# ADR-005: UI 包多框架支持架构

> **状态**: ✅ 已实施（Phase 1-3 完成）  
> **日期**: 2025-12-03  
> **决策者**: BMAD Agent  
> **类别**: 架构决策

---

## 📋 实施进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 1: @dailyuse/ui-core | ✅ 完成 | 核心 headless 逻辑 (form, loading, message, dialog, color-picker) |
| Phase 2: @dailyuse/ui-vue | ✅ 完成 | Vue 3 composables 包装 ui-core |
| Phase 3: @dailyuse/ui 集成 | ✅ 完成 | 现有包依赖 ui-vue，重新导出 composables |
| Phase 4: React 支持 | ⏳ 可选 | 用于 Electron Desktop (未来) |

### 当前包结构

```
packages/
├── ui-core/          # Framework-agnostic headless logic
│   └── src/
│       ├── form/         # Validation rules, password strength
│       ├── loading/      # Loading state machines
│       ├── message/      # Message/snackbar state
│       ├── dialog/       # Dialog state
│       └── color-picker/ # Color picker + utilities
│
├── ui-vue/           # Vue 3 composables
│   └── src/
│       └── composables/  # useLoading, useMessage, useDialog, etc.
│
└── ui/               # Vuetify components (depends on ui-vue)
    └── src/
        ├── components/   # Vue SFC with Vuetify
        └── composables/  # Re-exports from ui-vue
```

---

## 📋 背景

当前 `@dailyuse/ui` 包紧耦合于 Vue 3 + Vuetify：

```typescript
// 当前：硬编码 Vuetify 组件
<v-menu>
  <v-btn :style="{ backgroundColor: modelValue }">
  </v-btn>
</v-menu>
```

问题：
1. **框架锁定**：无法复用于 React/Desktop Electron
2. **UI 库锁定**：无法迁移到其他 UI 库（如 shadcn）
3. **业务逻辑耦合**：颜色选择逻辑与 Vuetify 组件混在一起

---

## 🎯 决策

采用 **Headless UI 模式** + **适配器层** 架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    @dailyuse/ui-core                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Headless Logic (Framework-Agnostic)                     ││
│  │ - State Management                                      ││
│  │ - Business Logic                                        ││
│  │ - Accessibility                                         ││
│  │ - Keyboard Navigation                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
              │                         │
              ▼                         ▼
┌──────────────────────┐    ┌──────────────────────┐
│  @dailyuse/ui-vue    │    │ @dailyuse/ui-react   │
│  ┌────────────────┐  │    │ ┌────────────────┐   │
│  │ Vue Adapters   │  │    │ │ React Adapters │   │
│  └────────────────┘  │    │ └────────────────┘   │
└──────────────────────┘    └──────────────────────┘
              │                         │
              ▼                         ▼
┌──────────────────────┐    ┌──────────────────────┐
│ @dailyuse/ui-vuetify │    │ @dailyuse/ui-shadcn  │
│ ┌────────────────┐   │    │ ┌────────────────┐   │
│ │ Vuetify Styled │   │    │ │ Shadcn Styled  │   │
│ │ Components     │   │    │ │ Components     │   │
│ └────────────────┘   │    │ └────────────────┘   │
└──────────────────────┘    └──────────────────────┘
```

---

## 📦 包结构

### 1. @dailyuse/ui-core（无框架依赖）

```
packages/ui-core/
├── src/
│   ├── color-picker/
│   │   ├── useColorPicker.ts      # 核心逻辑 Hook
│   │   ├── types.ts               # 类型定义
│   │   └── index.ts
│   │
│   ├── dialog/
│   │   ├── useDialog.ts           # 对话框状态管理
│   │   ├── useConfirm.ts          # 确认框逻辑
│   │   └── types.ts
│   │
│   ├── message/
│   │   ├── useMessage.ts          # 消息提示逻辑
│   │   ├── createMessageContext.ts
│   │   └── types.ts
│   │
│   ├── form/
│   │   ├── useFormValidation.ts   # 表单验证
│   │   ├── usePasswordStrength.ts
│   │   └── rules.ts
│   │
│   ├── accessibility/
│   │   ├── useKeyboardNav.ts      # 键盘导航
│   │   ├── useFocusTrap.ts        # 焦点陷阱
│   │   └── useAriaProps.ts
│   │
│   └── index.ts
├── package.json                    # 无框架依赖！
└── tsconfig.json
```

**核心逻辑示例：**

```typescript
// packages/ui-core/src/color-picker/useColorPicker.ts

export interface ColorPickerState {
  selectedColor: string | null;
  isOpen: boolean;
  colors: string[];
}

export interface ColorPickerActions {
  selectColor: (color: string) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseColorPickerOptions {
  defaultColor?: string | null;
  colors?: string[];
  onChange?: (color: string) => void;
}

/**
 * Headless Color Picker 逻辑
 * 纯逻辑，无 UI 框架依赖
 */
export function createColorPickerCore(options: UseColorPickerOptions = {}) {
  const {
    defaultColor = null,
    colors = DEFAULT_COLORS,
    onChange,
  } = options;

  let state: ColorPickerState = {
    selectedColor: defaultColor,
    isOpen: false,
    colors,
  };

  const listeners = new Set<(state: ColorPickerState) => void>();

  const notify = () => {
    listeners.forEach(fn => fn(state));
  };

  const actions: ColorPickerActions = {
    selectColor: (color: string) => {
      state = { ...state, selectedColor: color, isOpen: false };
      onChange?.(color);
      notify();
    },
    open: () => {
      state = { ...state, isOpen: true };
      notify();
    },
    close: () => {
      state = { ...state, isOpen: false };
      notify();
    },
    toggle: () => {
      state = { ...state, isOpen: !state.isOpen };
      notify();
    },
  };

  return {
    getState: () => state,
    subscribe: (fn: (state: ColorPickerState) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    ...actions,
  };
}

export const DEFAULT_COLORS = [
  '#FF5733', '#FF8C33', '#FFAA33', '#F1FF33', '#AAFF33',
  '#33FF57', '#33FFF1', '#33AAFF', '#3357FF', '#3333FF',
  '#AA33FF', '#FF33F1', '#FF33AA', '#FF3333', '#33FF33',
];
```

### 2. @dailyuse/ui-vue（Vue 适配层）

```
packages/ui-vue/
├── src/
│   ├── color-picker/
│   │   ├── useColorPicker.ts      # Vue Composable 适配
│   │   └── index.ts
│   │
│   ├── dialog/
│   │   ├── useDialog.ts
│   │   └── index.ts
│   │
│   ├── message/
│   │   ├── useMessage.ts
│   │   ├── MessageProvider.vue    # 基础无样式 Provider
│   │   └── index.ts
│   │
│   └── index.ts
├── package.json
│   peerDependencies:
│     vue: ^3.4.0
│     @dailyuse/ui-core: workspace:*
└── tsconfig.json
```

**Vue 适配器示例：**

```typescript
// packages/ui-vue/src/color-picker/useColorPicker.ts
import { ref, watch, onUnmounted } from 'vue';
import { createColorPickerCore, type UseColorPickerOptions } from '@dailyuse/ui-core';

/**
 * Vue Composable 适配器
 * 将 core 逻辑转换为 Vue 响应式 API
 */
export function useColorPicker(options: UseColorPickerOptions = {}) {
  const core = createColorPickerCore(options);
  
  // 响应式状态
  const selectedColor = ref(core.getState().selectedColor);
  const isOpen = ref(core.getState().isOpen);
  const colors = ref(core.getState().colors);

  // 订阅 core 状态变化
  const unsubscribe = core.subscribe((state) => {
    selectedColor.value = state.selectedColor;
    isOpen.value = state.isOpen;
    colors.value = state.colors;
  });

  onUnmounted(unsubscribe);

  return {
    // 响应式状态
    selectedColor,
    isOpen,
    colors,
    // 操作方法
    selectColor: core.selectColor,
    open: core.open,
    close: core.close,
    toggle: core.toggle,
  };
}
```

### 3. @dailyuse/ui-vuetify（Vuetify 样式组件）

```
packages/ui-vuetify/
├── src/
│   ├── components/
│   │   ├── DuColorPicker.vue      # Vuetify 样式的 ColorPicker
│   │   ├── DuDialog.vue
│   │   ├── DuConfirmDialog.vue
│   │   ├── DuMessageProvider.vue
│   │   └── ...
│   │
│   ├── composables/
│   │   └── index.ts               # 重导出 ui-vue composables
│   │
│   └── index.ts
├── package.json
│   peerDependencies:
│     vue: ^3.4.0
│     vuetify: ^3.7.0
│     @dailyuse/ui-vue: workspace:*
└── tsconfig.json
```

**Vuetify 组件示例：**

```vue
<!-- packages/ui-vuetify/src/components/DuColorPicker.vue -->
<template>
  <v-menu v-model="isOpen">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        :style="{ backgroundColor: selectedColor || defaultColor }"
        class="color-btn"
        :class="buttonClass"
        :icon="icon"
        :size="size"
        @click="toggle"
      >
        <v-icon v-if="icon" :color="iconColor">{{ iconName }}</v-icon>
      </v-btn>
    </template>
    
    <v-card min-width="200">
      <v-card-text>
        <div class="color-grid">
          <v-btn
            v-for="color in colors"
            :key="color"
            :style="{ backgroundColor: color }"
            class="color-option"
            :class="{ selected: selectedColor === color }"
            icon
            @click="selectColor(color)"
          >
            <v-icon v-if="selectedColor === color" color="white" size="small">
              mdi-check
            </v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useColorPicker } from '@dailyuse/ui-vue';

interface Props {
  modelValue?: string | null;
  colors?: string[];
  buttonClass?: string;
  icon?: boolean;
  iconName?: string;
  iconColor?: string;
  size?: 'small' | 'default' | 'large';
  defaultColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  icon: true,
  iconName: 'mdi-palette',
  iconColor: 'white',
  size: 'default',
  defaultColor: '#2196F3',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// 使用 headless composable
const { selectedColor, isOpen, colors, selectColor, toggle } = useColorPicker({
  defaultColor: props.modelValue,
  colors: props.colors,
  onChange: (color) => emit('update:modelValue', color),
});

// 同步外部 v-model 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== selectedColor.value) {
    selectColor(newVal!);
  }
});
</script>

<style scoped>
/* Vuetify 特定样式 */
.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.color-option {
  width: 32px;
  height: 32px;
}
</style>
```

---

## 🔄 迁移策略

### 阶段 1：提取核心逻辑（1-2 周）

1. 创建 `@dailyuse/ui-core` 包
2. 提取现有 composables 到 core
3. 保持 `@dailyuse/ui` 向后兼容

### 阶段 2：Vue 适配层（1 周）

1. 创建 `@dailyuse/ui-vue` 包
2. 创建 Vue Composable 适配器
3. 更新现有组件使用新适配器

### 阶段 3：Vuetify 组件层（1 周）

1. 重命名 `@dailyuse/ui` → `@dailyuse/ui-vuetify`
2. 更新组件使用 `@dailyuse/ui-vue`
3. 更新 apps/web 导入路径

### 阶段 4：React 支持（可选）

1. 创建 `@dailyuse/ui-react` 适配层
2. 为 Electron Desktop 提供 React 组件

---

## 📊 对比

| 方面 | 当前架构 | 新架构 |
|------|---------|--------|
| **框架支持** | 仅 Vue | Vue + React + ... |
| **UI 库支持** | 仅 Vuetify | Vuetify + Shadcn + ... |
| **代码复用** | 无 | 核心逻辑 100% 复用 |
| **测试** | 需要 DOM | 核心逻辑可纯单元测试 |
| **包大小** | 所有逻辑在一个包 | 按需引入 |
| **维护成本** | 低（单一实现） | 中（多层抽象） |

---

## ✅ 优点

1. **代码复用**：业务逻辑在 core 中只写一次
2. **框架灵活**：可以支持任意 UI 框架
3. **可测试**：核心逻辑可以纯单元测试
4. **渐进式**：可以逐步迁移，向后兼容
5. **符合业界最佳实践**：Radix、Headless UI 都采用此模式

## ❌ 缺点

1. **初始复杂度增加**：需要维护多层抽象
2. **学习曲线**：团队需要理解 headless 模式
3. **额外的包管理**：需要管理更多的包

---

## 📚 参考

- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Headless UI](https://headlessui.com/)
- [TanStack (React Query/Table)](https://tanstack.com/)
- [Downshift](https://www.downshift-js.com/)

---

**决策**: 待讨论  
**下一步**: 创建 POC 验证架构可行性
