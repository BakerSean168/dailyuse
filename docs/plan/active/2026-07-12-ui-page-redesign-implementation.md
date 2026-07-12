---
tags:
  - plan
  - active
  - ui
  - frontend
description: 页面级 UI 重构（UI Page Redesign Plan）的执行记录
created: 2026-07-12T00:00:00
updated: 2026-07-12T00:00:00
---

# 页面级 UI 重构 — 实施记录

> 方案真值：`docs/UI_PAGE_REDESIGN_PLAN.md`（下称 Plan），上游分析 `docs/UI_REDESIGN_BRIEF.md`（下称 Brief）。
> 本文只记录执行切片、状态与验收，不重复方案内容。范围：`packages/app-vue` + 两端宿主 `apps/web`、`apps/desktop`。

## 约束回顾（不可破坏）

- 双端同源：任何布局/导航改动在 Web + Electron 双端回归；保留 `isDesktopEnvironment` 分支。
- `data-testid` 随组件迁移（5 份 Playwright 配置锚定）：`main-nav-*` / `bottom-nav-*` 生成规则不变。
- 深链契约：`?dialog=goal&goalId=`、`/note/:id`、`/goals/:id`；删/改路由先加 redirect。
- 数据访问只走 DI 端口与 composable 门面，不直连 HTTP/IPC。
- `NavigationItem` 结构变更是破坏性接口变更 → 同步 `di/types.ts` + 两端 `di-app.ts` + `MainLayout.vue`。

## 实施顺序（Plan §15.3，每步可独立合并/回滚）

### P0 基建（本切片，无依赖）

- [x] 5 个共享组件（Plan §0.5）落 `packages/app-vue/src/components/shared/`：
  - `ListPageShell.vue`、`DetailPageShell.vue`、`ModuleSidebar.vue`、`AppEmptyState.vue`、`FilterBar.vue`
- [x] `NavigationItem` 接口扩展 `group? / icon? / badge?`（`di/types.ts`；两端宿主只透传默认数组，无需改 `di-app.ts`）
- [x] 导航分组 + 图标 + 铃铛：`di/navigation.ts` 重排（12→8+1 一级入口，含分组），`MainLayout.vue` 渲染分组/图标 + 侧栏底部 `NotificationBell` + `NotificationDrawer`
- [x] `/ai/chat` → `redirect: '/'`，导航项删除（`router/index.spec.ts` 断言改为重定向契约）
- [x] `/notifications`、`/account/center` 移出一级导航（路由保留深链）
- [x] 孤儿视图删除：`FocusModeView` / `FocusCycle` / `WeightSnapshotView`（goal）、`ScheduleWeekView`（schedule）
- [x] i18n key 补齐：`nav.group.workbench/plan/execute/knowledge`；`nav.repositories`「仓库」→「笔记」、`nav.governance`「治理」→「规范」；repository 路由 meta 硬编码中文 → `repository.route.*`；`common.collapse/expand`
- [x] `/goals/rules-demo` 加 `import.meta.env.DEV` 守卫（生产构建不注册该路由）
- [x] typecheck（app-vue tsc / web vue-tsc / desktop）+ app-vue 182 测试 + lint 0 error 通过

实现备注：
- `ModuleSidebar` 用简单可折叠 aside（w-64 ↔ w-10 细轨）而非 ResizablePanel 封装——ResizablePanel 要求 panel 是 group 直接子节点，无法在独立容器组件内封装；折叠行为契约不变。
- e2e 契约核对：`main-nav-home` 仍是第一个、`main-nav-dashboard` 第二个（dashboard-overview.spec.ts:107-109）、`bottom-nav-settings` 保留。

### P1 招牌路径（依赖 P0）
- §1 AI 工作台（按钮迁移 + 右栏三态）；§2 仪表盘压缩；§6 任务页（视图模式 + 危险区）

### P2 对齐批（依赖 P0）
- §3–§5 目标、§7 日程（含 EventDetailSheet）、§8 提醒、§11 通知、§12 治理、§13 设置

### P3 笔记收缩（依赖 P0）
- §9 / §10 阶段 0（退役 + 收敛 + 更名）

## 验收（Plan §15.4）

1. 5 份 Playwright 配置全绿（`ai-workspace` 重点）。
2. Electron 手动回归：导航、`isDesktopEnvironment`、桌面通知路由、IPC 链路。
3. 深链契约逐条验证。
4. i18n zh-CN / en-US 无缺 key。
5. 断点走查 xl / lg / md / sm。
6. RN 端文案同步（仓库→笔记、任务模板→任务库）通知维护者。

## 进度日志

- 2026-07-12：读方案 + Brief + 代码基线，确认现状（`MainLayout` 纯文字 12 入口、5 shared 组件待建、孤儿视图存在）。开工 P0。
- 2026-07-12：P0 完成（分支 `refactor/ui-redesign-p0-foundation`）：共享壳 ×5、导航分组/图标/铃铛、`/ai/chat` redirect、孤儿视图删除、i18n 补齐、rules-demo DEV 守卫。app-vue tsc + web vue-tsc + desktop tsc + 182 unit tests + lint 全绿。开工 P1。
