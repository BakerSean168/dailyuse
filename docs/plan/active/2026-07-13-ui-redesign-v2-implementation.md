---
tags:
  - plan
  - active
  - ui
  - frontend
description: UI 重构 V2 方案（ChatGPT 桌面式壳）的执行记录
created: 2026-07-13T00:00:00
updated: 2026-07-14T00:00:00
---

# UI 重构 V2 — 实施记录

> 方案真值：`docs/UI_REDESIGN_V2_PLAN.md`（下称 V2），上游分析 `docs/UI_REDESIGN_BRIEF.md`（下称 Brief）。
> 2026-07-14 Electron 实机诊断后的壳层修订见 [`2026-07-14-ui-shell-diagnostic-followup.md`](./2026-07-14-ui-shell-diagnostic-followup.md)；Settings、Schedule、面板拖拽、Composer、用户入口和胶囊预览的后续实施以该文档为准。
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
- [x] `AIChatView` → 常驻层拆解设计（不改 composable 契约，仅调整消费方从路由页面变为壳层组件）——**已在 S1 落地**（整组件常驻 + `hideConversationSidebar`/`composerOnly` prop + defineExpose，见 S1 节）

**S0 验证**：`pnpm nx run app-vue:typecheck` ✅（唯一报错 TS2742 是 radix-vue `TagsInput` 既有可移植性警告，非本次代码，target 成功）+ `app-vue:lint` ✅ 0 error（本次新增代码 0 warning）。未跑 e2e（S0 未挂载）。

### S1 切换 PR（一次性替换 MainLayout）— ✅ 代码完成 2026-07-13，PR #176（门槛项 1/3/5 待环境）

拆两个 commit 但同 PR：

**Commit 1 — 壳骨架**（`feat(app-vue): V2 shell skeleton (S0)`）：S0 全部内容，未接线。

**Commit 2 — 接线切换**（`refactor(app-vue)!: S1 switch`）+ **Commit 3**（KeepAlive 修复）：

- [x] 删除 `MainLayout.vue`；**AppShell 直接作为 `/` 父路由组件**（比"App.vue 挂壳"更贴合既有路由结构：`/auth`、`/custom-notification` 天然留在壳外，auth guard/meta 不动）。`DashboardView`/`WelcomeView` 一并删除
- [x] `<router-view>` 移入 `BusinessPanel`，`<KeepAlive :max="8">` 按 Tab 保活；**缓存键 = `{owningTabId}:{routeName}`**（KeepAlive 同 key 不同组件类型会复用错实例 → `ctx.deactivate` 崩溃，路由身份必须编进 key——上过一次真浏览器才抓到）
- [x] AI 常驻层：**保留 `AIChatView` 组件整体**（新增 `hideConversationSidebar` / `composerOnly` 两个 prop + `defineExpose` 会话状态），AppShell 单实例挂载、三态用 CSS order/v-show 切换（专注态收成底部 Composer 条），**实例永不卸载**——流式回复跨 B⇄C 存活；useAIChatView 及 4 workflow composable 契约零改动（**43 用例状态机 spec 原样通过**）。壳侧栏消费 expose 的会话列表（今天/近 7 天/更早本地时区分组）。独立 `AIWorkspaceLayer` 组件不再需要——S3 精修时再拆
- [x] Router ↔ Tab 双向同步（`useShellRouterSync`，V2 §4）：afterEach 落 Tab（精确路由激活 / 活动 Tab 同模块回写 / 其余新开不抢占）；`/` = STATE A 清空面板；**导航先行**（关活动 Tab/面板先 replace/push，成功才改 store→未保存守卫有效）；挂载时会话恢复（`/` + 持久化 Tab → replace 回活动 Tab 路由）
- [x] Redirect：`/dashboard` → `/` 新增；`/ai/chat`、`/account/center` 已在 main。设置深链自动 focus（V2 §3）、<1024px 新开面板自动 focus（§1.1）
- [x] 导航 DI 重定义：`NavigationItem` / `MAIN_NAVIGATION_KEY` / `BOTTOM_NAVIGATION_KEY` 删除，两端 `di-app.ts` 改 provide `MODULE_CAPSULES_KEY`（破坏性接口变更，V2 §8-5）
- [x] 桌面端：`useDesktopWindowControls` 迁入 app-vue（WindowHeader 接窗控 + 拖拽区 + mac 交通灯留位）；认证 renderer 独立 bootstrap 并自带无边框窗控，宿主 `App.vue` 的旧 `desktop-titlebar` 已移除；`shouldRedirectAuthenticatedDesktopEntry` 收窄为仅 auth/未解析入口（否则会与 Tab 会话恢复竞态互踩）
- [x] 各模块视图原样入面板（路由一条未删）；i18n 新增 `shell.panel.tabLimitHint` zh/en
- [x] E2E：dashboard 套件重写为"退役 redirect + 胶囊壳"契约（`capsule-nav-*` 取代 `main-nav-*`）；其余 spec 的模块 testid 未动
- [x] 新增单测：`useAppShellStore.spec`（Tab 语义/LRU/关闭规则）+ `useShellRouterSync.spec`（模块映射）

**S1 验证**：
- app-vue / web / desktop 的 typecheck + lint + test 全绿（web 走 vue-tsc 覆盖 SFC 类型）；web/desktop vite build 通过
- **MSW mock 模式真浏览器冒烟 30/30**：登录 → STATE A（胶囊/AI 层/无面板）→ 胶囊预览进入 → split → focus 切换（Composer 条可达）→ 双 Tab → reload 会话恢复 → boot-at-`/` 恢复 → 新对话回地面 → 三条 redirect → settings focus → 关面板回 STATE A，0 页面错误；三态截图核对与 V2 §1.1 一致
- **待环境的门槛项**（V2 §10 验收 6 条中）：#1 Playwright 5 配置全量（需真实 API+DB）、#3 Electron 手动回归、#5 AI 三工作流端到端。mock 冒烟已覆盖 #2 深链、#4 Web 形态、#6 i18n 无缺 key（部分）
- 已知转移项：mock 模式下 `TaskManagementView` 冷加载因 MSW 缺 handler 500 后白屏（**非本次回归**，视图与 mock 均未动；错误边界粒度收进 S2 面板化改造考虑）

### S2 面板内容改造（每模块独立 PR）

顺序：Goal → Task → Schedule → Reminder → Notification → Settings。V1 对应章节的"主/次操作、删减清单、拆分/退役、空态设计"已落地在 main，本分支上的改造 = **保留 V1 成果 + 面板化差异**（V2 §6.1–6.7 表）。

**面板两档基建（S2 通用，Goal 切片建立，后续模块复用）**：
- `usePanelWidth` / `providePanelWidth`（`layouts/shell`）：`BusinessPanel` 用 ResizeObserver 实测内容宽度并 provide `{ width, tier, isNarrow, isWide }`；`tier` = narrow(<900px，split) / wide(focus)。**这是 V2 §7"视口四档 → 面板两档"的落地机制**——业务视图不再用 `md:`/`lg:`/`xl:` 视口断点，改用面板宽度档位。
- `BusinessPanel` 内容区 = Tailwind v4 命名容器 `@container/panel`：结构切换（侧栏↔下拉）走 JS 档位，纯样式（网格列）走 CSS 容器查询（`@2xl/panel:` 等）。

- [x] **Goal（§6.1）— PR #177**：`GoalViewSwitcherBar`（窄档收第二侧栏为顶部下拉，系统视图计数+文件夹+专注+新建）↔ `GoalSidebar`（宽档）按档位二选一；`GoalListView` 网格改容器查询；testid 契约（`goal-system-view-*`/`goal-focus-entry`/`create-goal-entry`）随迁。验证：app-vue lint/typecheck/test 189 通过 + web vue-tsc + MSW 冒烟 10/10（同 1280 视口 split=1 列/focus=3 列）
- [x] **Task（§6.2）— PR #178**：`TaskManagementView` 以 `usePanelWidth()` 替换视口断点；窄档禁用拖拽建依赖 + 图谱/DAG 并提示最大化（`task-drag-narrow-hint` / `task-graph-narrow-hint`），宽档恢复；`TaskFilterBar`/`TaskDetailView`/`TaskDependencyGraph`/`TaskTemplateGrid` 网格与搜索改容器查询；testid 契约保留。验证：app-vue lint/typecheck/test 193 通过 + web vue-tsc + MSW 冒烟 15/15（同 1280 视口 split=拖拽/图谱禁用+1 列、focus=恢复+3 列）
- [x] **Schedule（§6.3）— PR #179**：进入默认 focus（`shouldOpenInFocus`）；`ScheduleCalendarView` 窄档强制日视图+提示、宽档日/周/月；头部日程胶囊接 `useCalendarView` 当前/下一事件（每分钟刷新）；容器查询收尾。验证：app-vue 194 测试 + web vue-tsc + MSW 冒烟 9/9
- [x] **Reminder（§6.4）— PR #180**：窄档 `ReminderGroupSwitcherBar`（分组下拉+新建）↔ 宽档完整分组侧栏；全局 master switch 任何档位面板头可达；模板网格/搜索改 `@*/panel` 容器查询；`create-reminder-template-button` testid 随迁。验证：app-vue 199 测试 + web vue-tsc + MSW 冒烟 14/14（同 1280 视口 split=switcher+master、focus=sidebar+master）
- [x] **Notification（§6.5）— PR #182**：胶囊预览浮层（最近 N + 全部已读 + 查看全部）+ 完整信箱归档面板；testid 契约随迁。验证见 #182。
- [x] **Settings（§6.6）— PR #181**：进入默认 focus；6 分组 + 账户中心迁入 + `?tab=` 契约保留。验证见 #181。

### S3 AI 工作区精修

- [x] **S3（§6.0）— PR #183**：欢迎态 + 四快捷指令卡 + 今日概览三 widget；`AIWorkflowActionBar` 迁 Composer 上方条 + 消息时间线状态内嵌；产物就绪 `openTab({ intent: 'deeplink' })` 新开业务 Tab 不抢占；空闲右栏概览退役；`useAIChatView`/4 workflow composable 契约零改。验证：app-vue 208 测试 + web vue-tsc + MSW 冒烟 18/18。

### S4 Note 阶段 0 收尾（含 Governance 并入）

- [x] **S4（§6 Note / §3 Governance 并入）— PR #184**：面板顶部分区 **[笔记 | 规范]**（`NoteModuleLayout` + `NoteSegmentBar`）；`/repository`、`/note/:id`、`/governance/**` 路径契约保留，深链 `/governance/**` 自动落「规范」；窄档侧栏 mode 收敛顶栏、宽档完整侧栏；编辑器反链/图谱窄档提示最大化；阶段 0 残留入口（TabManager/批量导入/自包含导出）隐藏；governance 表单网格改 `@*/panel` 容器查询。验证：app-vue 205 测试 + web vue-tsc + MSW 冒烟 18/18（#184）。

### S5 重构收尾 / 验收（S0–S4 功能切片已全部合入 main）

功能主线已结束。本阶段不做新模块面板化，只做稳定性与门槛补齐：

- [x] **MSW 缺口**：补 `GET /api/v1/task-templates/graph` + 模板 update `PATCH`（保留 PUT 兼容），消除 mock 下 Task 冷加载/图谱白屏（PR S5）
- [x] **面板级错误边界**：`PanelErrorBoundary` 包住 BusinessPanel 内容区；`onErrorCaptured` 拦截面板致命错误，重试/切 Tab 可恢复；testid：`panel-error-boundary` / `panel-error-fallback` / `panel-error-retry`
- [x] **Playwright 核心回归适配新壳**：helpers `navigateToTasks/Reminder` 与 `TaskPage` 改 `/tasks`；新增 `openModulePanel`/`openModuleViaCapsule`；dashboard capsule enter 优先 `capsule-preview-enter-*`；e2e README 补 V2 锚点。**5 份 config 真 API 全绿仍待环境**
- [x] **桌面宿主标题栏收尾**：认证窗口由独立 `DesktopAuthApp` bootstrap 渲染并自带无边框菜单/关闭；删除主 renderer `App.vue` 中不可达的 auth host titlebar、窗控订阅及样式，主窗口继续由 `WindowHeader` 负责窗控，custom notification 保持 chrome-less
- [ ] **S1 门槛剩余项（需真环境）**：Playwright 5 配置全绿、Electron 手动回归、AI 三工作流 E2E
- [ ] **plan 归档**：S1 门槛补齐后，将本文件移至 `docs/plan/archive/`，并在 archive 文首注明结果

**非阻塞（V2 §11，可另开 plan）**：胶囊计数数据源统一、会话分组时区边界、Tab 集合恢复策略微调、KeepAlive 内存上界实测。

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
- 2026-07-13：**S1 切换完成**（3 commits：S0 骨架 / S1 接线切换 / KeepAlive 键修复）。关键实现取舍：① AppShell 直接坐进 `/` 父路由位（不动 App.vue，auth/custom-notification 天然壳外）；② AIChatView 不拆成 AIWorkspaceLayer 而是整组件常驻 + 两 prop + defineExpose——43 用例 AI 状态机 spec 零改动通过，S3 再精修；③ KeepAlive 缓存键必须含路由 name（同 key 换组件类型 = Vue 复用错实例崩溃，真浏览器冒烟抓到后修复）；④ 桌面 entry redirect 收窄防止与会话恢复竞态。全链路验证 = 三项目 typecheck/lint/test/build + MSW 真浏览器冒烟 30/30（三态/多 Tab/恢复/redirect/0 报错）。**待环境项**：真实 API Playwright 全量、Electron 手动回归、AI 三工作流 e2e。**下一步：S2 面板内容改造（Goal 首个）**；S1 期间发现的 S2 输入：分栏态 AI 列被 AIContextPanel 挤压（S3 拆）、Goal 面板窄档第二侧栏待收敛（§6.1）、面板级错误边界（业务视图崩溃不应吃掉整壳）、<768 侧栏 overlay 未做、日程胶囊实时文案未接（useCalendarView，S2-Schedule）。
- 2026-07-13：**S2-Goal 完成（PR #177）**，S1 已 squash-merge 到 main（#176，`33e9429a0`）。建立 S2 通用的**面板两档基建**（`usePanelWidth` + `BusinessPanel` 的 `@container/panel` 命名容器）——V2 §7 落地机制，后续每模块复用。Goal 切片：窄档 `GoalViewSwitcherBar`（第二侧栏收顶部下拉）↔ 宽档 `GoalSidebar` 按档位切换，`GoalListView` 网格改容器查询，testid 契约随迁。验证：app-vue 189 测试 + web vue-tsc + MSW 冒烟 10/10（同 1280 视口下 split=1 列+切换栏、focus=3 列+完整侧栏，真截图核对）。**下一步：S2-Task（§6.2）**——任务库更名、FilterBar、图谱视图、拖拽建依赖仅 focus 档启用；用户策略 = 前端重构基本完成后再统一修 S1/S2 途中的既有 bug（MSW 缺 handler 白屏、面板级错误边界等），S2 各切片只做结构性面板化、不夹带 bug 修复。
- 2026-07-13：**S2-Task 启动（仅调研，未写代码）**。#177（S2-Goal）已合入 main（`1b4b91a98`）；分支 `refactor/ui-v2-s2-task` 自该点切出，**零提交**。调研发现（Task 模块面板化落点）：① 视口断点残留 = `TaskFilterBar.vue:95`（搜索框 `hidden w-56 md:block` → 应改 `@3xl/panel:block`）、`TaskDetailView.vue`（多处 `sm:grid-cols-2/3` → `@2xl/panel:` 系）、`TaskDependencyGraph.vue:90`（`md:grid-cols-2` → 容器查询）；② 拖拽相关文件 = `components/TaskTemplateGrid.vue`、`components/cards/DraggableTaskCard.vue`、`components/dag/TaskDAGVisualization.vue`、`views/TaskManagementView.vue`（573 行）——**§6.2 核心 = 拖拽建依赖仅 focus 档启用**（`usePanelWidth().isNarrow` 时禁用拖拽 + 提示"最大化后可用"，§7 窄档重交互约定），图谱视图窄档同理；③ V1 内容级结论（任务库更名/FilterBar/图谱视图模式/全部删除入危险区）已在 main，S2-Task 只做面板化差异。交接：本切片移交外部执行，方法论与验证流程见上方 S2-Goal 记录（两档基建复用 + MSW 冒烟 + testid 契约随迁）。
- 2026-07-13：**S2-Task 完成（PR #178）**，分支 `refactor/ui-v2-s2-task` @ `7b23db243`。复用 S2 面板两档基建：`TaskManagementView` 拖拽建依赖/图谱仅 focus（wide）启用，split 窄档禁用并提示最大化；FilterBar/Detail/DependencyGraph/TemplateGrid 视口断点改 `@*/panel` 容器查询；i18n 补 `dragRequiresFocus`。验证：app-vue 193 测试 + web vue-tsc + MSW 冒烟 15/15（同 1280 视口 split 1 列+禁用拖拽/图谱、focus 3 列+恢复交互）。**下一步：S2-Schedule（§6.3）**——进入即建议 focus、split 只渲日视图、`ScheduleDashboardView` → `ScheduleCalendarView` 更名、日程胶囊接 `useCalendarView`；既有 bug（MSW 缺 `/task-templates/graph` 白屏、面板级错误边界等）仍按用户策略留到重构收尾统一修。
- 2026-07-13：**S2-Schedule 完成（PR #179）**，分支 `refactor/ui-v2-s2-schedule` @ `5e248f33d`。进入日程默认 focus；split 仅日视图；`useCalendarView` 驱动头部日程胶囊实时文案；更名/EventDetailSheet 已在 main。验证：app-vue 194 测试 + web vue-tsc + MSW 冒烟 9/9。**下一步：S2-Reminder（§6.4）**——分组侧栏在 split 窄档收为下拉；全局开关任何档位保持面板头可达。
- 2026-07-13：**S2-Reminder 完成（PR #180）**，分支 `refactor/ui-v2-s2-reminder` @ `2b264aedf`。复用 S2 面板两档基建：窄档分组侧栏收为 `ReminderGroupSwitcherBar`，宽档恢复完整侧栏；全局提醒总开关始终在面板头（`reminder-master-switch`）；搜索/网格改容器查询。验证：app-vue lint/typecheck/test 199 通过 + web vue-tsc + MSW 冒烟 14/14。**下一步：S2-Notification（§6.6）**——胶囊预览浮层（最近 N 条 + 全部已读 + 查看全部）+ 完整信箱归档页；既有 bug 仍按用户策略留到重构收尾统一修。
- 2026-07-13：**S2 全模块完成**（Notification #182、Settings #181 与更早 Goal/Task/Schedule/Reminder 均已合入 main）。
- 2026-07-13：**S3 完成（PR #183）**，分支 `refactor/ui-v2-s3-ai-workspace` @ `f83df2c31`。欢迎态四快捷卡 + 今日概览迁入主列；工作流生命周期按钮挂 Composer 上方条、状态贴近消息时间线；产物（目标创建/草稿就绪/笔记创建）经 shell deeplink 新开业务 Tab；空闲右栏概览移除。状态机：`AIChatView.spec` 29 + 新增 `AIMessagePanel.spec` 4，全包 208 通过。MSW 冒烟 18/18。**下一步：S4 Note 阶段 0 收尾（Governance 并入「规范」分区，若并行 PR 已开则合并后做全量回归）**；S1 遗留的分栏态 AI 列被右栏挤压问题本切片通过「操作条离右栏、今日概览离右栏」实质缓解；既有 MSW/错误边界 bug 仍留重构收尾统一修。

- 2026-07-13：**S3/S4 已合入 main**（#183 `f1aeb3d53` / #184 `82cca35e1`）。S0–S4 功能切片全部完成。
- 2026-07-13：**进入 S5 重构收尾**（用户拍板顺序 A→B→C）：A 更新本 plan 勾选 S4 + 收尾清单；B MSW graph/patch + 面板错误边界；C Playwright helpers/核心 flow 对新壳适配。不新开模块面板化切片。既有 MSW 白屏与面板级错误边界按用户策略在本阶段统一修。

- 2026-07-13：**S5 收尾切片完成（代码，PR 待合）**——分支 `refactor/ui-v2-s5-cleanup`。A plan 勾选 S4 + 收尾清单已推 main（`efc163c8f`）。B：MSW `GET /task-templates/graph` + `PATCH` update；`PanelErrorBoundary` 接入 AppShell + 4 单测 + i18n。C：e2e helpers/TaskPage/dashboard capsule 适配新壳。验证：app-vue lint/typecheck/test **213** 通过（0 lint error）；web vue-tsc 通过；web task.handlers **8** 通过；MSW 冒烟 **15/15**（`/tasks` 面板健康、边界挂载无 fallback、胶囊/关面板回 AI）。**下一步**：合入本 PR 后，真环境跑 5 份 Playwright + Electron 手动 + AI 三工作流 E2E，再归档 plan。
