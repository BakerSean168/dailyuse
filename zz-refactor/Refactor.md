---
# DailyUse 统一架构计划
## 一、目标架构全景
```
┌──────────────────────────────────────────────────────────────────┐
│                        应用壳 (Thin Shells)                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  apps/web    │  │ apps/desktop     │  │    apps/api      │   │
│  │  (Vite SPA)  │  │ (Electron shell) │  │   (Express)      │   │
│  │              │  │                  │  │                  │   │
│  │ - index.html │  │ - main process   │  │ - routes         │   │
│  │ - main.ts    │  │   (IPC,SQLite,   │  │ - middleware     │   │
│  │ - DI config  │  │    services)     │  │ - DI config      │   │
│  │   (HTTP      │  │ - renderer/      │  └──────────────────┘   │
│  │    adapters)  │  │   main.ts        │                        │
│  │              │  │   DI config      │                        │
│  │              │  │   (IPC adapters)  │                        │
│  └──────┬───────┘  └──────┬───────────┘                        │
│         │                  │                                     │
│         └──────┬───────────┘                                     │
│                ▼                                                 │
│  ┌─────────────────────────────┐                                │
│  │   packages/app-vue (NEW)    │  ← 所有共享的 Vue 3 展示层      │
│  │                             │                                │
│  │  modules/                   │                                │
│  │    task/                    │                                │
│  │      components/            │ ← 业务组件 (从 ui-vue-shadcn 迁入) │
│  │      composables/           │ ← 业务 hooks (从 web 迁入)     │
│  │      stores/                │ ← Pinia stores (从 web 迁入)   │
│  │      views/                 │ ← 页面组件 (从 web 迁入)       │
│  │      widgets/               │                                │
│  │      router/                │                                │
│  │    goal/                    │                                │
│  │    schedule/                │                                │
│  │    ...                      │                                │
│  │  layouts/                   │ ← MainLayout, AuthLayout       │
│  │  shared/                    │ ← DI types, result helpers     │
│  │  router/                    │ ← 统一路由定义                   │
│  └──────────┬──────────────────┘                                │
│             │                                                    │
│  ┌──────────▼──────────────────┐                                │
│  │  packages/ui-vue-shadcn     │  ← 纯 UI 原子组件 + 通用组合组件 │
│  │  (瘦身后: 只保留 ui/ 目录)    │                                │
│  │  - button, dialog, card...  │                                │
│  │  - composables (useDialog,  │                                │
│  │    useMessage, useConfirm)  │                                │
│  │  - linear/ (通用 Linear 布局)│                                │
│  └──────────┬──────────────────┘                                │
│             │                                                    │
│  ┌──────────▼──────────────────┐                                │
│  │  packages/ui-core           │  ← 框架无关 headless 逻辑       │
│  │  (validation, password,     │                                │
│  │   dialog/loading/message    │                                │
│  │   stores, color picker)     │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              领域包 (不变，纯业务逻辑)                          │ │
│  │  task, goal, schedule, reminder, repository, account,       │ │
│  │  authentication, notification, setting, governance, editor, │ │
│  │  ai, contracts, utils, http-client, ipc-client, ...         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```
## 二、核心设计原则
### 2.1 平台差异通过 DI 消除
```
                    app-vue composable
                           │
                    inject(SERVICE_KEY)
                           │
              ┌────────────┼────────────┐
              ▼                          ▼
     HttpTaskAdapter              IpcTaskAdapter
     (apps/web 注册)              (apps/desktop 注册)
              │                          │
     @dailyuse/task               @dailyuse/task
     /infrastructure-client       /infrastructure-client
     (HTTP 适配器)                 (IPC 适配器)
```
- `app-vue` 中的 composables/stores **只依赖接口**（`ITaskService`、`IGoalService` 等）
- `apps/web/src/main.ts` 注入 HTTP 适配器
- `apps/desktop/src/renderer/main.ts` 注入 IPC 适配器
- 领域包的 `infrastructure-client` 已经提供了两套适配器，这个模式现有代码已经支持
### 2.2 app-vue 的内部结构
```
packages/app-vue/
├── package.json
├── project.json
├── tsconfig.json
├── vite.config.ts              # lib mode 打包
├── src/
│   ├── index.ts                # barrel export
│   │
│   ├── di/                     # DI 接口定义 + InjectionKeys
│   │   ├── keys.ts             # 所有 InjectionKey 定义
│   │   └── types.ts            # 服务接口类型
│   │
│   ├── router/                 # 统一路由表
│   │   ├── index.ts            # createAppRouter()
│   │   └── guards.ts           # 路由守卫
│   │
│   ├── layouts/                # 布局组件
│   │   ├── MainLayout.vue
│   │   └── AuthLayout.vue
│   │
│   ├── modules/                # 领域模块（核心内容）
│   │   ├── task/
│   │   │   ├── index.ts
│   │   │   ├── components/     # 业务组件（从 ui-vue-shadcn/custom/task 迁入）
│   │   │   │   ├── TaskInstanceCard.vue
│   │   │   │   ├── TaskTemplateForm.vue
│   │   │   │   └── ...
│   │   │   ├── composables/    # 业务 hooks（从 web/modules/task 迁入）
│   │   │   │   ├── useTask.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/         # Pinia stores（从 web/modules/task 迁入）
│   │   │   │   └── taskStore.ts
│   │   │   ├── views/          # 页面（从 web/modules/task 迁入）
│   │   │   │   ├── TaskListView.vue
│   │   │   │   ├── TaskDetailView.vue
│   │   │   │   └── TaskManagementView.vue
│   │   │   ├── widgets/
│   │   │   │   └── TodayTasksWidget.vue
│   │   │   └── router/
│   │   │       └── index.ts
│   │   │
│   │   ├── goal/               # 同上结构
│   │   ├── schedule/
│   │   ├── reminder/
│   │   ├── repository/
│   │   ├── account/
│   │   ├── authentication/
│   │   ├── editor/
│   │   ├── notification/
│   │   ├── setting/
│   │   └── governance/
│   │
│   ├── shared/                 # 跨模块共享工具
│   │   └── utils/
│   │       └── result-helpers.ts
│   │
│   └── views/                  # 非模块页面
│       ├── WelcomeView.vue
│       ├── DashboardView.vue   # 从 desktop 的 dashboard 概念引入
│       └── NotFoundView.vue
```
### 2.3 瘦身后的 apps/web
```
apps/web/
├── index.html
├── package.json                # 依赖: app-vue, ui-vue-shadcn, ui-core,
│                               #   各领域包的 infrastructure-client, http-client
├── src/
│   ├── main.ts                 # 入口: createApp → 注册 HTTP 适配器 → mount
│   ├── App.vue                 # <RouterView />
│   ├── platform/               # Web 平台特定配置
│   │   ├── di.ts               # provide HTTP 适配器实例
│   │   ├── pwa.ts              # PWA/SW 注册（可选）
│   │   └── mocks.ts            # MSW 配置
│   └── styles/
│       └── index.css           # Web 特定样式（如有）
├── public/
├── e2e/
├── vite.config.ts
└── tsconfig.json
```
### 2.4 瘦身后的 apps/desktop (renderer)
```
apps/desktop/
├── src/
│   ├── main/                   # 保持不变（Electron main process）
│   │   ├── main.ts
│   │   ├── bootstrap.ts
│   │   ├── lifecycle/
│   │   ├── database/
│   │   ├── modules/
│   │   └── ...
│   │
│   ├── preload/                # 保持不变
│   │   └── preload.ts
│   │
│   └── renderer/               # 重写: React → Vue 3 薄壳
│       ├── main.ts             # 入口: createApp → 注册 IPC 适配器 → mount
│       ├── App.vue             # <RouterView />
│       ├── platform/           # Desktop 平台特定配置
│       │   ├── di.ts           # provide IPC 适配器实例
│       │   ├── electron.ts     # window controls, tray hooks 等
│       │   └── titlebar.vue    # 自定义标题栏（frameless window）
│       └── styles/
│           └── index.css
│
├── index.html
├── package.json                # 依赖: app-vue, ui-vue-shadcn, ui-core,
│                               #   各领域包的 infrastructure-client, ipc-client
├── vite.config.ts
└── electron-builder.json5
```
## 三、要删除的包/代码
| 删除目标 | 原因 |
|----------|------|
| `packages/ui-react/` | 不再使用 React |
| `packages/ui-react-shadcn/` | 不再使用 React |
| `packages/ui-vuetify/` | 遗留 Vuetify，已被 shadcn 替代 |
| `apps/web/src/modules/app/MainLayout.vue` | 遗留 Vuetify MainLayout |
| `apps/web/src/modules/app/components/Sidebar.vue` | 遗留 Vuetify Sidebar，引用不存在的模块 |
| `apps/web/src/modules/app/components/SidebarMoreMenu.vue` | 遗留 Vuetify，dead code |
| `apps/desktop/src/renderer/` (全部 React 代码) | 将用 Vue 3 重写 |
| `ui-vue-shadcn/src/components/custom/` (业务组件) | 迁移到 `app-vue` 后删除 |
## 四、ui-vue-shadcn 瘦身方案
迁移后，`ui-vue-shadcn` 只保留：
```
packages/ui-vue-shadcn/src/
├── index.ts                    # 只导出 ui/ 和 composables/
├── components/
│   ├── ui/                     # 51 个 shadcn 原子组件 (保留全部)
│   │   ├── button/
│   │   ├── dialog/
│   │   ├── card/
│   │   ├── ...
│   └── custom/                 # 只保留通用 (非业务) 组件
│       └── linear/             # LinearListItem, LinearPanel 等通用布局组件
├── composables/                # 保留全部 (useDialog, useMessage, etc.)
├── lib/
│   └── utils.ts
└── styles/
    └── globals.css
```
**迁移映射**：
| 从 `ui-vue-shadcn/custom/` | 迁移到 `app-vue/modules/` |
|---|---|
| `account/` (ProfileCard, ProfileForm) | `account/components/` |
| `authentication/` (LoginForm, RegisterForm) | `authentication/components/` |
| `task/` (30+ 组件) | `task/components/` |
| `goal/` (30+ 组件) | `goal/components/` |
| `schedule/` (WeekView, StatCard...) | `schedule/components/` |
| `reminder/` (TemplateCard, GroupDialog...) | `reminder/components/` |
| `repository/` (FileTree, RepoCard...) | `repository/components/` |
| `notification/` (Bell, Drawer, List...) | `notification/components/` |
| `governance/` (RuleCard, SearchBar...) | `governance/components/` |
| `editor/` (MarkdownEditor...) | `editor/components/` |
| `setting/` (AppearanceSettings...) | `setting/components/` |
| `application/` (composables, services, templates) | `shared/` 或相应模块 |
## 五、依赖关系图 (目标)
```
apps/web ──────────────┐
                       ├──→ packages/app-vue ──→ packages/ui-vue-shadcn ──→ packages/ui-core
apps/desktop/renderer ─┘         │
                                 ├──→ @dailyuse/contracts (类型)
                                 ├──→ @dailyuse/utils
                                 └──→ 各领域包的类型 (domain-client)
apps/web ──→ @dailyuse/http-client + 各包 infrastructure-client (HTTP 适配器)
apps/desktop/renderer ──→ @dailyuse/ipc-client + 各包 infrastructure-client (IPC 适配器)
apps/api ──→ 各领域包 application-server + infrastructure-server + api
apps/desktop/main ──→ 各领域包 electron-entry
```
## 六、执行计划（分阶段）
### Phase 0: 清理 (1-2 天)
1. 删除 `packages/ui-react/`、`packages/ui-react-shadcn/`、`packages/ui-vuetify/`
2. 删除 web 中的遗留文件（旧 MainLayout、Vuetify Sidebar 等）
3. 删除 web 中标记 `@deprecated` 的文件
4. 修复 `WelcomeView.vue` 的 `currentUser` bug
5. 清理 console.log 调试残留
6. 更新 `tsconfig.base.json` 移除已删除包的路径别名
7. 更新 `pnpm-workspace.yaml` 确认
8. 确保 `nx build web` 和 `nx test web` 仍然通过
### Phase 1: 创建 app-vue 包骨架 (2-3 天)
1. `nx g @nx/vue:library app-vue --directory=packages/app-vue` 或手动创建
2. 配置 `package.json`、`project.json`、`tsconfig.json`、`vite.config.ts`
3. 定义 DI 接口 (`di/keys.ts`, `di/types.ts`)
4. 创建 `router/index.ts` — 统一路由表（合并所有模块路由，修复当前只注册 2 个的问题）
5. 迁移 `layouts/MainLayout.vue` 和路由守卫
6. 迁移 `shared/utils/result-helpers.ts`
### Phase 2: 逐模块迁移到 app-vue (5-8 天)
按模块逐个迁移，每个模块的步骤：
1. 从 `ui-vue-shadcn/custom/{module}/` 复制业务组件到 `app-vue/modules/{module}/components/`
2. 从 `apps/web/src/modules/{module}/` 复制 composables、stores、views、router
3. 更新 import 路径
4. 统一 API 调用模式（全部使用 DI + Result 模式，消除 deprecated httpClient 用法）
5. 在 `ui-vue-shadcn/index.ts` 中移除对应的 custom 组件导出
6. 验证 web 仍然正常工作
建议迁移顺序（按复杂度递增）：
1. `setting` → `account` → `authentication` (简单，少组件)
2. `notification` → `reminder` → `editor` (中等)
3. `schedule` → `repository` → `governance` (中等偏复杂)
4. `task` → `goal` (最复杂，30+ 组件，依赖关系多)
### Phase 3: Web 瘦身 (1-2 天)
1. `apps/web/src/modules/` 下所有内容已迁移到 app-vue，删除整个目录
2. web 只保留 `main.ts`、`App.vue`、`platform/di.ts`
3. `main.ts` 中 `createApp` → 安装 Pinia → 安装 app-vue router → provide HTTP adapters → mount
4. 验证所有路由和功能正常
### Phase 4: Desktop Renderer 重写 (3-5 天)
1. 创建 `apps/desktop/src/renderer-vue/` (新目录，避免覆盖旧代码)
2. 设置 Vue 3 + Vite 配置 (修改 `vite.config.ts` 的 renderer 入口)
3. 创建 `main.ts` — 与 web 类似，但注入 IPC 适配器
4. 创建 `platform/di.ts` — 注入 IPC 适配器
5. 创建 `platform/electron.ts` — window controls、titlebar、tray hooks
6. 处理 desktop 特有功能：
   - 自定义标题栏 (frameless window)
   - 登录窗口 (multi-window)
   - 系统托盘交互
   - 快捷键
   - 离线状态处理
7. 确认所有 IPC 通道仍然工作
8. 删除旧的 React renderer (`src/renderer/`)
### Phase 5: 收尾与优化 (1-2 天)
1. 清理 `ui-vue-shadcn/custom/` 中已迁移的组件
2. 更新所有 `package.json` 依赖
3. 清理 `tsconfig.base.json` 路径别名
4. 全面 lint + typecheck + test
5. 更新 CI/CD 配置（如有）
6. 更新文档
---
预估总工作量：13-22 天
风险与注意事项
| 风险 | 缓解措施 |
|------|----------|
| Desktop 特有功能（titlebar、multi-window auth、tray）无法简单共享 | 在 app-vue 中提供插槽/条件渲染，desktop 通过 platform/ 目录注入特有组件 |
| 迁移过程中 web 功能回退 | 每迁移一个模块后立即运行 e2e 测试，保持 web 始终可用 |
| ui-vue-shadcn/custom/ 组件与 shadcn primitives 深度耦合 | 迁移时保持 import 路径指向 @dailyuse/ui-vue-shadcn，只改变组件的存放位置 |
| IPC 适配器和 HTTP 适配器接口不完全对称 | Phase 1 定义 DI 接口时做对齐，必要时补充缺失的适配器方法 |
---

这个计划是否符合你的预期？有以下几点我想确认：
1. Dashboard 页面 — desktop 有一个功能丰富的 Dashboard（stats、charts、quick actions），web 目前只有 WelcomeView。统一后是否需要在 app-vue 中创建一个通用 Dashboard？
2. 登录流程 — desktop 使用 multi-window 模式（独立 login window），web 是路由跳转。这部分差异你希望如何处理？

关于 Dashboard：在未来的 app-core 中构建一个极其强大的通用 Dashboard 业务组件，通过平台适配器（DI）在桌面端显示额外系统级卡片，在 Web 端降级显示。

关于登录流程：采用依赖注入。app-core 提供核心的 AuthView，但在点击登录成功后，是由外层宿主传入的 onLoginSuccess 回调来决定是路由跳转（Web）还是关闭当前窗口（Desktop）。

