---
tags:
  - plan
  - active
  - ui
  - frontend
description: UI 重构 V2 方案（ChatGPT 桌面式壳）的执行记录
created: 2026-07-13T00:00:00
updated: 2026-07-13T04:30:00
---

# UI 重构 V2 — 实施记录

> 方案真值：`docs/UI_REDESIGN_V2_PLAN.md`（下称 V2），上游分析 `docs/UI_REDESIGN_BRIEF.md`（下称 Brief）。
> V1 方案 `docs/UI_PAGE_REDESIGN_PLAN.md` 及其实施记录 `2026-07-12-ui-page-redesign-implementation.md` 由 V2 §1.2 表格明确取代/保留，本文不重复其内容。
> 分支：`refactor/ui-redesign-v2-shell`（自 `main @ 5584baf07` 切出，含 V1 P0–P3 全部落地）。
> 范围：`packages/app-vue`（新壳）+ `apps/desktop`（无边框窗口/IPC）+ `apps/web`（同壳去窗饰）。

## 起点盘点

**基线**：`main @ 5584baf07` = 「refactor(app-vue): UI redesign P0–P3」（V1 P0–P3 已 squash-merge，PR #174）。

**V2 可直接复用（V1 落地成果，已在 main）**：
- V1 建的 `AppEmptyState` / `FilterBar`（V2 §1.2 保留）
- Note 阶段 0 收敛（TabManager 退役、编辑器/文件树七件套收敛到 `TypedFileTree` + editor 模块 CodeMirror6）
- 各模块内容级删减（V1 §1–14，V2 §6 引用为面板内容输入）
- 设置 6 分组 + 账户中心迁入
- 通知 / 治理 / 日程 / 提醒 / 目标的 ListPageShell/FilterBar 套壳

**V2 明确作废（在本分支反向移除）**：
- `ListPageShell` / `DetailPageShell` / `ModuleSidebar` 三壳（V2 §1.2）
- `MainLayout.vue` 左侧分组导航
- `di/navigation.ts` 的 8 项分组数据（换 5 胶囊模块清单）
- 侧栏底部 `NotificationBell` 挂载（通知已是胶囊）
- V1 §0.4 的视口四档响应式约定（换面板两档 §7）

**必须新建**：
- `AppShell` / `WindowHeader` / `ConversationSidebar` / `BusinessPanel`（多 Tab）/ `GlobalComposer`
- 壳级 UI store（Tab 集合 / activeTabId / layout / 宽度偏好 / 会话恢复）
- 日程"当前时段"胶囊（消费 `useCalendarView`）
- 桌面宿主无边框窗口 + `window:minimize` / `window:maximize` / `window:close` IPC
- `AIChatView` → 常驻层的拆解（`useAIChatView` 及 4 workflow composable 原样保留）

## V2 §11 待细化的拍板记录（2026-07-13）

| 项 | 决策 | 说明 |
|---|---|---|
| Tab `<KeepAlive>` 内存策略 | **LRU 保 8 个**，超出上限的最久未激活 Tab 出提示（不自动关，避免丢状态） | V2 §2.3 上限建议 8 |
| Tab 集合会话恢复 | **localStorage 恢复 Tab 列表 + 各 Tab 当前路由 + layout 偏好**（贴合"应用式"心智） | 未保存守卫在 Tab 关闭时同样触发；恢复时按 §2.3 打开规则重建 |
| `MainLayout.vue` 过渡策略 | **切换 commit 内直接删除**（分支/PR 本身是回退单位，不留双轨） | V2 §10 决策 #7 |

其余 V2 §11 遗留项（胶囊计数数据源、会话分组时区、日程胶囊刷新策略、多 Tab KeepAlive 内存上界实测）在 S1/S2 遇到时再拍。

## 实施顺序（V2 §10）

### S0 准备（本切片，与主干独立）— ✅ 完成 2026-07-13

- [x] 壳组件骨架建立（5 组件：`AppShell` / `WindowHeader` / `ConversationSidebar` / `BusinessPanel` / `GlobalComposer`，落 `packages/app-vue/src/layouts/shell/`）+ 交互：拖宽、折叠、Tab 增删/激活/关闭、B ⇄ C 转换。`AppShell` 已把 4 个子组件接到 store（胶囊进入/开设置/新对话/拖宽均为纯 store 操作，可交互），仅 router/AI/IPC 接线留 slot + noop 待 S1
- [x] 壳级 UI store（Pinia，`layouts/shell/useAppShellStore.ts`）：`tabs` / `activeTabId` / `layout` / `sidebarCollapsed` / `sidebarWidth` / `panelWidth`；`openTab`(capsule/deeplink intent + LRU 8 淘汰候选返回) / `activateTab` / `closeTab`(相邻切换) / `closeAllTabs` / `toggleFocus` 等 action；`keepAliveInclude` getter；`persist.pick` 持久化 `tabs/activeTabId/layout/宽度`（会话恢复）
- [x] `NavigationItem` → 新增 `ModuleCapsule` 接口（`di/types.ts`，**保留** `NavigationItem` 供 MainLayout 用到 S1 删）；`MODULE_CAPSULES_KEY`（`di/keys.ts`）；`defaultModuleCapsules` 5 项（`di/navigation.ts`）；barrel 导出（`di/index.ts`）。两端 `di-app.ts` 的 provide 留 S1（S0 用 inject fallback 到 default，不阻塞）
- [x] 桌面窗控：`WindowHeader` 已渲染窗控按钮 + 拖拽区（`window-header--drag`/`no-drag`），`isDesktop` 分支门控。确认主窗口已 `titleBarStyle:'hidden'`（`desktop-chrome.ts`）+ `attachWindowControlStateSync`——**宿主无需新工作**；`useDesktopWindowControls` 实际接线 = S1（composable 在 `apps/desktop`，窗控 emit 已就位）
- [ ] `AIChatView` → 常驻层拆解设计（不改 composable 契约，仅调整消费方从路由页面变为壳层组件）——**移至 S1**（属接线设计，S0 骨架已用 slot 预留 `ai-workspace` / `composer` 挂载点）

**S0 验证**：`pnpm nx run app-vue:typecheck` ✅（唯一报错 TS2742 是 radix-vue `TagsInput` 既有可移植性警告，非本次代码，target 成功）+ `app-vue:lint` ✅ 0 error（本次新增代码 0 warning）。未跑 e2e（S0 未挂载）。

### S1 切换 PR（一次性替换 MainLayout）

拆两个 commit 但同 PR：

**Commit 1 — 壳骨架**：S0 全部内容 + 空 `AppShell` 未接线。

**Commit 2 — 接线切换**：
- 删除 `MainLayout.vue`，`App.vue` 挂 `AppShell`
- `<router-view>` 移入 `BusinessPanel`；AI 常驻层挂 `AIWorkspaceLayer`
- Router ↔ Tab 双向同步：`beforeEach` 落 Tab、切 Tab `router.replace`（V2 §4）
- Redirect：`/dashboard` → `/`、`/ai/chat` → `/`、`/account/center` → `/settings?tab=account`
- 各模块视图**原样**入面板（允许窄档难看，S2 再改内容）
- E2E 全量修复（testid 不动，布局断言按新壳更新）
- i18n 新 key（胶囊标题、面板头、日程胶囊空态）zh/en 两份

验收清单见 V2 §10 "S1 切换 PR 的门槛" 6 条。

### S2 面板内容改造（每模块独立 PR）

顺序：Goal → Task → Schedule → Reminder → Notification → Settings。V1 对应章节的"主/次操作、删减清单、拆分/退役、空态设计"已落地在 main，本分支上的改造 = **保留 V1 成果 + 面板化差异**（V2 §6.1–6.7 表）。

### S3 AI 工作区精修

V2 §6.0：欢迎态 + 今日概览三 widget + 工作流按钮内嵌消息卡 + 产物自动新开面板 Tab + legacy 分支删除。状态机回归为重点。

### S4 Note 阶段 0 收尾（含 Governance 并入）

V1 P3 已完成 Note 阶段 0 大部分（TabManager/EditorSplitView/导出批量导入退役、文件树/编辑器收敛、预览优先）。本阶段主要工作 = **Governance 以"规范"分区并入 Note 面板**（`/governance/**` 渲染到规范分区，V2 §6 表）+ P3 遗留项（如 `BatchImportDialog`/`SelfContainedExportDialog` 若未完全退役则补完、侧栏三模式图标条改造）。

## 与 P3 分支的收敛（已解决 2026-07-13）

**决策**：方案 A——将 P0–P3 合入 main，V2 分支基于新 main 起步，保留 V1 全部内容级改造。

**执行**：PR #174（改 base 为 main，含完整 P0–P3 stack）已 squash-merge 到 main，合并提交 `5584baf07`。stacked PR #172、#173 标记为被 #174 取代并关闭。本分支已 rebase 至最新 main。

## S0 调研发现（2026-07-13）

已读基线代码，确认新壳落点与既有资产：

- **Web `App.vue`**（`apps/web/src/App.vue`）：`<GlobalErrorBoundary><router-view /></GlobalErrorBoundary>` + 全局 overlays，干净。新壳挂载点。
- **Desktop `App.vue`**（`apps/desktop/src/renderer/App.vue`）：已有 `desktop-titlebar` 自绘标题栏（logo + 应用名 + 窗口控件），`<router-view>` 在其下。**没有导航层**——导航来自路由链里的 `MainLayout.vue`。
- **导航来源**：`MainLayout.vue` 是路由的一环（父路由 component），业务视图经其内部 `<router-view>` 渲染。新 `AppShell` 取代 `MainLayout` 这个位置。
- **桌面窗控已完整**：`useDesktopWindowControls`（`apps/desktop/src/renderer/useDesktopWindowControls.ts`）封装 `WindowChannels.{MINIMIZE,TOGGLE_MAXIMIZE,CLOSE,GET_CONTROLS_STATE}` + `WINDOW_STATE_CHANGED` 订阅，走 `DESKTOP_BRIDGE_KEY` inject / `window.electronAPI` 兜底。**任务 #5 = 迁移这套到 WindowHeader，不是新建**。
- **导航 DI 现状**：`NavigationItem { path, title, group?, icon?, badge? }`（`di/types.ts`）；`defaultMainNavigation`（8 项分组）+ `defaultBottomNavigation`（设置 1 项）在 `di/navigation.ts`；两端 `di-app.ts` 各 `provide(MAIN_NAVIGATION_KEY / BOTTOM_NAVIGATION_KEY, ...)`。`ModuleCapsule` 重定义需同步这 4 处 + `di/keys.ts` 的 InjectionKey。
- **整合风险**：桌面端不能有两层标题栏——`WindowHeader`（含胶囊导航 + 窗控）必须同时承担现 `desktop-titlebar` 职责，`desktop-titlebar` 那段在 S1 切换时移除或改为仅 macOS 交通灯留位。

## 进度日志

- 2026-07-13：本分支自 `main @ 84b51173e` 切出。V2 §11 三项待细化拍板（LRU 8 / localStorage 恢复 / 直接删 MainLayout）落记录。S0 待启动。
- 2026-07-13：**S0 完成**（分支 `refactor/ui-redesign-v2-shell`）：壳级 Pinia store（多 Tab + LRU 8 + 会话恢复持久化）+ `ModuleCapsule` DI 接口（types/keys/navigation/barrel）+ 5 个壳组件（`AppShell` 三态容器 / `WindowHeader` 胶囊+窗控 / `ConversationSidebar` 纯会话列表 / `BusinessPanel` 多 Tab / `GlobalComposer`）+ i18n `shell.*`/`nav.capsule.*` zh/en 两份。`AppShell` 已把子组件接到 store（可交互），router/AI/IPC 接线用 slot + noop 预留 S1。确认桌面主窗口已 frameless（`titleBarStyle:'hidden'` + 窗控状态同步），宿主无需新工作。typecheck + lint 全绿（0 error）。**未挂载**（`App.vue`/router 不变，`MainLayout` 仍生效）——切换在 S1。下一步 S1 切换 PR。
- 2026-07-13：S0 调研完成（读 `di/types.ts`、`di/navigation.ts`、`di/keys.ts`、web/desktop 两端 `App.vue` 与 `di-app.ts`、`useDesktopWindowControls.ts`）。关键结论：桌面窗控 IPC 全套已存在（任务 #5 降级为"迁移到 WindowHeader"）；新壳取代 `MainLayout` 路由位置；`ModuleCapsule` 重定义需同步 5 处（`di/types.ts` + `di/keys.ts` + web/desktop 两 `di-app.ts` + 新壳消费）。**下一步：S0 开始写代码——先建 5 个空壳组件 + `useAppShellStore` + `ModuleCapsule` 接口，均不接线、不改 `App.vue`。**
