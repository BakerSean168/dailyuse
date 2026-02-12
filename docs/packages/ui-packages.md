# 📦 UI 包系列文�?

> DailyUse 多框�?UI 组件�?

## 概述

DailyUse 采用多框�?UI 策略，支�?Vue 3 (Web) �?React 19 (Desktop) 两套前端技术栈。UI 包分为以下几个层次：

```
┌─────────────────────────────────────────────────────────�?
�?                   UI 包层级结�?                        �?
├─────────────────────────────────────────────────────────�?
�?                                                        �?
�? Framework-Specific (框架特定)                          �?
�? ┌─────────────�? ┌─────────────�? ┌─────────────────�?�?
�? �? ui-vuetify �? �? ui-react-shadcn  �? �?  (future...)   �?�?
�? �? (Web)      �? �? (Desktop)  �? �?                �?�?
�? └──────┬──────�? └──────┬──────�? └────────┬────────�?�?
�?        �?               �?                  �?         �?
�?        �?               �?                  �?         �?
�? Framework Base (框架基础)                              �?
�? ┌─────────────────────�? ┌─────────────────────────�? �?
�? �?     ui-vue         �? �?      ui-react          �? �?
�? �? (Vue 3 通用组件)    �? �? (React 通用组件)        �? �?
�? └──────────┬──────────�? └───────────┬─────────────�? �?
�?            �?                        �?                �?
�?            └───────────┬─────────────�?                �?
�?                        �?                              �?
�? Framework Agnostic (框架无关)                          �?
�? ┌──────────────────────────────────────────────────�? �?
�? �?                   ui-core                        �? �?
�? �? (通用逻辑、样式、类型定�?                         �? �?
�? └──────────────────────────────────────────────────�? �?
�?                                                        �?
└─────────────────────────────────────────────────────────�?
```

---

## @dailyuse/ui-core

### 概述

框架无关�?UI 核心包，提供通用逻辑、样式和类型定义�?

### 主要内容

```
packages/ui-core/
├── src/
�?  ├── styles/              # 共享样式
�?  �?  ├── variables.css    # CSS 变量
�?  �?  ├── typography.css   # 排版样式
�?  �?  └── utilities.css    # 工具�?
�?  ├── types/               # 类型定义
�?  �?  ├── component.ts     # 组件通用类型
�?  �?  └── theme.ts         # 主题类型
�?  ├── constants/           # 常量
�?  �?  ├── colors.ts        # 颜色常量
�?  �?  └── spacing.ts       # 间距常量
�?  └── utils/               # 工具函数
�?      ├── cn.ts            # 类名合并
�?      └── responsive.ts    # 响应式工�?
├── package.json
└── tsconfig.json
```

### 使用示例

```typescript
import { cn, colors, spacing } from '@dailyuse/ui-core';

// 类名合并
const className = cn('base-class', condition && 'conditional-class');

// 颜色常量
const primaryColor = colors.primary[500];

// 间距常量
const padding = spacing.md;
```

---

## @dailyuse/ui-vue

### 概述

Vue 3 通用组件库，提供基础 Vue 组件�?

### 主要组件

| 组件 | 描述 |
|------|------|
| `BaseButton` | 基础按钮 |
| `BaseInput` | 基础输入�?|
| `BaseCard` | 基础卡片 |
| `BaseDialog` | 基础对话�?|
| `BaseDropdown` | 基础下拉菜单 |
| `BaseIcon` | 图标组件 |

### 目录结构

```
packages/ui-vue/
├── src/
�?  ├── components/
�?  �?  ├── BaseButton.vue
�?  �?  ├── BaseInput.vue
�?  �?  ├── BaseCard.vue
�?  �?  └── ...
�?  ├── composables/
�?  �?  ├── useForm.ts
�?  �?  ├── useDialog.ts
�?  �?  └── useToast.ts
�?  └── index.ts
├── package.json
└── tsconfig.json
```

### 使用示例

```vue
<template>
  <BaseButton variant="primary" @click="handleClick">
    点击�?
  </BaseButton>
</template>

<script setup>
import { BaseButton } from '@dailyuse/ui-vue';
</script>
```

---

## @dailyuse/ui-vuetify

### 概述

基于 Vuetify 3 �?Material Design 组件库，用于 Web 应用�?

### 主要组件

| 组件 | 描述 |
|------|------|
| `AppBar` | 应用顶栏 |
| `NavigationDrawer` | 侧边导航 |
| `GoalCard` | 目标卡片 |
| `TaskList` | 任务列表 |
| `CalendarView` | 日历视图 |
| `StatisticsChart` | 统计图表 |

### 目录结构

```
packages/ui-vuetify/
├── src/
�?  ├── components/
�?  �?  ├── layout/
�?  �?  �?  ├── AppBar.vue
�?  �?  �?  └── NavigationDrawer.vue
�?  �?  ├── goal/
�?  �?  �?  ├── GoalCard.vue
�?  �?  �?  └── GoalProgress.vue
�?  �?  ├── task/
�?  �?  �?  ├── TaskList.vue
�?  �?  �?  └── TaskItem.vue
�?  �?  └── calendar/
�?  �?      └── CalendarView.vue
�?  └── index.ts
├── package.json
└── tsconfig.json
```

### 使用示例

```vue
<template>
  <GoalCard :goal="goal" @click="handleGoalClick">
    <template #actions>
      <v-btn icon @click.stop="handleEdit">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>
  </GoalCard>
</template>

<script setup>
import { GoalCard } from '@dailyuse/ui-vuetify';
</script>
```

---

## @dailyuse/ui-react

### 概述

React 通用组件库，提供基础 React 组件�?

### 主要组件

| 组件 | 描述 |
|------|------|
| `Button` | 基础按钮 |
| `Input` | 基础输入�?|
| `Card` | 基础卡片 |
| `Dialog` | 基础对话�?|
| `Dropdown` | 基础下拉菜单 |
| `Icon` | 图标组件 |

### 目录结构

```
packages/ui-react/
├── src/
�?  ├── components/
�?  �?  ├── Button.tsx
�?  �?  ├── Input.tsx
�?  �?  ├── Card.tsx
�?  �?  └── ...
�?  ├── hooks/
�?  �?  ├── useForm.ts
�?  �?  ├── useDialog.ts
�?  �?  └── useToast.ts
�?  └── index.ts
├── package.json
└── tsconfig.json
```

### 使用示例

```tsx
import { Button } from '@dailyuse/ui-react';

function MyComponent() {
  return (
    <Button variant="primary" onClick={handleClick}>
      点击�?
    </Button>
  );
}
```

---

## @dailyuse/ui-react-shadcn

### 概述

基于 shadcn/ui 的组件库，用�?Desktop 应用 (React 19)�?

### 主要组件

| 组件 | 描述 |
|------|------|
| `Sidebar` | 侧边�?|
| `Header` | 顶栏 |
| `GoalCard` | 目标卡片 |
| `TaskList` | 任务列表 |
| `CalendarView` | 日历视图 |
| `SettingsPanel` | 设置面板 |

### 目录结构

```
packages/ui-react-shadcn/
├── src/
�?  ├── components/
�?  �?  ├── ui/              # shadcn/ui 基础组件
�?  �?  �?  ├── button.tsx
�?  �?  �?  ├── card.tsx
�?  �?  �?  ├── dialog.tsx
�?  �?  �?  └── ...
�?  �?  ├── layout/
�?  �?  �?  ├── Sidebar.tsx
�?  �?  �?  └── Header.tsx
�?  �?  ├── goal/
�?  �?  �?  ├── GoalCard.tsx
�?  �?  �?  └── GoalProgress.tsx
�?  �?  └── task/
�?  �?      ├── TaskList.tsx
�?  �?      └── TaskItem.tsx
�?  └── index.ts
├── package.json
└── tsconfig.json
```

### 使用示例

```tsx
import { GoalCard, Button } from '@dailyuse/ui-react-shadcn';

function GoalList({ goals }) {
  return (
    <div className="space-y-4">
      {goals.map(goal => (
        <GoalCard key={goal.uuid} goal={goal}>
          <Button variant="outline" size="sm" onClick={() => handleEdit(goal)}>
            编辑
          </Button>
        </GoalCard>
      ))}
    </div>
  );
}
```

---

## 包使用规�?

| 应用 | 可用�?|
|------|--------|
| **Web (Vue 3)** | ui-core, ui-vue, ui-vuetify |
| **Desktop (React 19)** | ui-core, ui-react, ui-react-shadcn |

---

## 相关文档

- [ADR-005: UI 多框架策略](../architecture/adr/ADR-005-ui-package-multi-framework.md)
- [Web 架构](../architecture/web-architecture.md)
- [Desktop 架构](../architecture/desktop-architecture.md)
