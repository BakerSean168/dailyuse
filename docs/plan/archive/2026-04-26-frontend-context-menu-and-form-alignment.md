---
tags:
  - plan
  - archive
  - frontend
description: 从旧计划目录迁移的前端上下文菜单与表单 DTO 对齐计划
created: 2026-04-26T00:00:00
updated: 2026-04-26T00:00:00
status: archived
source: legacy-plan-workspace/frontend-context-menu-and-form-alignment.md
---

# Frontend Context Menu Infrastructure + Form-DTO Alignment

## Archive Note

这份计划从旧的辅助计划目录迁移而来，保留为历史实施参考。新的计划目录统一为 `docs/plan`。

## Overview

Two parallel efforts:

1. **Context Menu Infrastructure** — Build a reusable `ActionableWrapper` component that provides right-click context menu + hover-reveal dropdown on any card/item, then apply it across all modules.
2. **Form-DTO Alignment** — Expand form dialogs to collect all fields their contract DTOs require, starting with Goal (8 missing fields).

## Architecture Decision: Dual-Menu Rendering

Since shadcn's `ContextMenuItem` and `DropdownMenuItem` are separate Radix primitives that cannot be nested inside each other's parent, the `ActionableWrapper` will use a data-driven menu definition pattern:

- Each entity defines a `useXxxMenuActions()` composable that returns a reactive `MenuAction[]` array
- `ActionableWrapper` renders these actions as `ContextMenuItem` inside the context menu and as `DropdownMenuItem` inside the dropdown
- This avoids the slot-sharing problem entirely

```ts
interface MenuAction {
  key: string;
  label: string;
  icon?: Component;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean;
  handler: () => void;
}
```

## Planned Changes

### Shared infrastructure

- Create `packages/app-vue/src/components/shared/ActionableWrapper.vue`
- Create `packages/app-vue/src/components/shared/types.ts` for `MenuAction`
- Add barrel exports in `packages/app-vue/src/components/shared/index.ts`
- Re-export from `packages/app-vue/src/index.ts`

### Goal module

- Expand `GoalDialog.vue` to align with `CreateGoalReq` and support edit mode
- Update `GoalListView.vue` to open `GoalDialog` in edit mode
- Expand `GoalFolderDialog.vue` with `description` and `color`
- Expand `KeyResultDialog.vue` with `description`
- Apply `ActionableWrapper` to `GoalCard.vue`
- Apply `ActionableWrapper` to `GoalFolder.vue`
- Apply `ActionableWrapper` to `KeyResultCard.vue`

## Notes

- The original plan contained detailed component-level implementation notes and menu schemas.
- Keep this file as a historical reference; if the work resumes, create a new active plan in `docs/plan/active`.
