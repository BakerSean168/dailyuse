# shadcn-vue Official Components (ui/)

⚠️ **DO NOT MODIFY FILES IN THIS DIRECTORY** ⚠️

## 说明

此目录存放通过 `shadcn-vue` CLI 生成的官方组件。这些组件是框架提供的原始源码。

### 为什么不能修改？

1. **版本管理**: 这些组件需要与 shadcn-vue 保持同步
2. **升级安全**: 执行 `pnpm dlx shadcn-vue@latest add <component>` 时会覆盖此目录
3. **职责分离**: 原始组件应保持"纯净"，所有定制化应在 `custom/` 目录完成

### 如何添加组件

使用 shadcn-vue CLI 添加官方组件：

```bash
# 在项目根目录执行
pnpm dlx shadcn-vue@latest add button
pnpm dlx shadcn-vue@latest add card
pnpm dlx shadcn-vue@latest add dialog
```

### 如果需要自定义？

请在 `../custom/` 目录创建新组件：

```
src/components/
├── ui/              ← 官方组件（不可改）
│   ├── Button.vue
│   └── Card.vue
└── custom/          ← 你的自定义组件
    ├── ColorPicker.vue
    └── DataTable.vue
```

然后在 `@dailyuse/ui-vue` 包中进行逻辑封装和聚合导出。

---

**架构层级：**
- `ui-core` → 纯 TS 逻辑（无头组件）
- `ui-vue-shadcn/ui/` → 官方 shadcn 组件（样式 + 结构）
- `ui-vue-shadcn/custom/` → 自定义组件
- `ui-vue` → 逻辑封装 + 聚合导出
