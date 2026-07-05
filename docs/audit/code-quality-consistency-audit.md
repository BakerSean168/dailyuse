# Code Quality & Consistency Audit

**Date:** 2026-07-02
**Auditor:** Codex (read-only audit)
**Scope:** `apps/api`, `apps/web`, `apps/desktop`, `packages/task`, `packages/goal`, `packages/schedule`, `packages/reminder`
**Method:** Workflow 0-5, targeted code reading, dependency scan, targeted test execution
**Status (2026-07-04):** 历史审计快照。对应的 Core Seam Reconvergence 修复计划已执行完成；后续请以当前代码、测试和归档计划为准，本文件保留 `Q-*` 问题编号用于追踪历史收敛路径。

## 1. Executive Summary

当前项目的整体架构意图是清晰的：应用层通过 Nx monorepo 组织，领域包普遍采用 `contracts -> controller -> use case -> repository` 的分层模式，`task`、`goal`、`schedule`、`reminder` 这些核心模块也都有明确的入口文件和测试 target。

本轮审查发现，当前最大的风险不是“所有代码都失控”，而是少数核心边界已经开始松动，尤其集中在三处：

- API 顶层启动代码已经越过“模块自治”边界，直接理解并拼装 `goal/task/reminder/notification/schedule` 的内部依赖链。
- `task` 核心聚合 `TaskTemplate` 仍存在真实循环依赖，且已经通过 lazy import 规避模块加载问题，这说明结构问题已经落到实现层。
- “谁来把业务事件投影成 schedule task” 这个核心规则分散在 `task/goal/reminder` 三个模块，各自维护、各自监听、各自删建，缺少统一事实来源和直接测试保护。

最影响后续维护的问题是 Q-001、Q-002、Q-004。它们会让后续任何关于调度、通知、任务模板的改动都更容易变成跨模块联动修改。

整体判断：项目更接近“主体结构仍清晰，但核心边界需要重新收敛”的状态，而不是“只有局部风格问题”。建议优先做小步、可验证的边界收敛，而不是一次性大重构。

## 2. Project Map

### Module Structure

```text
dailyuse/
├── apps/
│   ├── api/       Express API bootstrap and host-only infra
│   ├── web/       Vue app bootstrap, DI, auth/http wiring
│   ├── desktop/   Electron shell, profile runtime, window lifecycle
│   ├── ai-service/ Python service
│   └── mobile/    placeholder
├── packages/
│   ├── contracts/ shared DTO/schema/result definitions
│   ├── domain-shared/ cross-domain value objects
│   ├── task/      task domain, controllers, API/electron transport
│   ├── goal/      goal domain, controllers, API/electron transport
│   ├── schedule/  scheduling domain, runtime, execution queue
│   ├── reminder/  reminder domain, schedule projection contributor
│   ├── notification/ notification domain
│   ├── app-vue/   shared frontend modules
│   └── other domain/UI/infra packages
└── docs/, tools/, nx.json, package.json
```

### Core Entry Points

| Surface | Entry | Observed Role |
| --- | --- | --- |
| API | `apps/api/src/main.ts` | 进程启动、数据库连接、模块注册、跨模块 schedule source executor 装配 |
| API host bootstrap | `apps/api/src/bootstrap.ts` | Express app、middleware、OpenAPI、模块上下文、统一挂载 |
| Web | `apps/web/src/main.ts` | 认证壳与主应用壳的分发 |
| Web app bootstrap | `apps/web/src/bootstrap/app.ts` | Pinia、router、i18n、启动 hook、DI 安装 |
| Desktop | `apps/desktop/src/main/main.ts` | Electron 主进程组合根 |
| Desktop lifecycle | `apps/desktop/src/main/lifecycle/window-manager.ts` | 登录/主窗口切换、schedule runtime 生命周期触发点 |

### Priority Review Files

- `apps/api/src/main.ts`
- `apps/api/src/bootstrap.ts`
- `apps/web/src/bootstrap/app.ts`
- `apps/web/src/platform/di-app.ts`
- `apps/web/src/platform/http.ts`
- `apps/desktop/src/main/main.ts`
- `apps/desktop/src/main/lifecycle/window-manager.ts`
- `packages/task/src/domain-server/aggregates/task-template.ts`
- `packages/task/src/domain-server/aggregates/task-template-factory.ts`
- `packages/task/src/api/module.ts`
- `packages/task/src/api/runtime.ts`
- `packages/task/src/api/schedule-runtime.ts`
- `packages/goal/src/api/module.ts`
- `packages/goal/src/api/transport-handlers.ts`
- `packages/goal/src/api/schedule-runtime.ts`
- `packages/schedule/src/api/module.ts`
- `packages/schedule/src/api/runtime.ts`
- `packages/schedule/src/api/transport-handlers.ts`
- `packages/reminder/src/api/module.ts`
- `packages/reminder/src/api/schedule-runtime.ts`

### Current Inferred Responsibility Boundaries

- `apps/*` 应该是宿主层组合根，负责“注册模块”和宿主专属设施。
- `packages/*/api` 和 `packages/*/electron-entry` 应该只做 transport/host adapter。
- `packages/*/application-server` 应该定义明确的 use-case 边界。
- `packages/*/domain-server` 应该承载稳定的领域模型和不变量。
- `packages/schedule` 应该拥有调度任务的执行与运行时队列。
- `contracts` 与 `domain-shared` 应该是 DTO、schema、枚举、ID 约束的单一来源。

### High-Risk Areas

- `apps/api/src/main.ts` 的跨模块装配。
- `packages/task/src/domain-server/aggregates/*` 的聚合拆分方式。
- `packages/task|goal|reminder/src/api/schedule-runtime.ts` 与 `packages/schedule/src/api/runtime.ts` 的投影与执行链。
- `apps/web/src/bootstrap` 与 `apps/web/src/platform` 的启动和 DI 隐式约定。
- `apps/desktop/src/main/lifecycle` 的窗口与 runtime 生命周期协作。

### Core Flows

#### Flow A: Web Main App Bootstrap

```text
用户打开 Web
↓
apps/web/src/main.ts
↓
bootstrapMainApp()
↓
Pinia / i18n / Router / installAppServices
↓
apps/web/src/platform/http.ts tokenProvider + refresh + unauthorized redirect
↓
各 feature application-client 懒加载 HTTP service
↓
页面路由与启动 hook 生效
```

| Stage | Owner | Input | Output | Risk |
| --- | --- | --- | --- | --- |
| main dispatch | `apps/web/src/main.ts` | 浏览器入口 | 认证壳或主壳 | 缺少直接测试 |
| app bootstrap | `apps/web/src/bootstrap/app.ts` | 主壳路径 | 已挂载 Vue app | `requestIdleCallback` 启动 hook 依赖隐式时序 |
| DI install | `apps/web/src/platform/di-app.ts` | app 实例 | 13+ service provider | 服务注册是人工枚举，扩展成本高 |
| auth/http | `apps/web/src/platform/http.ts` | Pinia store | token、refresh、redirect | 依赖 “Pinia 已经就绪” 的隐式约定 |

#### Flow B: API Server Startup

```text
进程启动
↓
apps/api/src/main.ts bootstrap()
↓
connectDatabase + ensurePowerSyncPublication
↓
create*PrismaRepositories + CreateNotificationUseCase + createSharedSourceExecutor
↓
ApiBootstrapper.register(...).init()
↓
Express middleware / routes / /api and /api/v1 mount
↓
listen + cron scheduler start
```

| Stage | Owner | Input | Output | Risk |
| --- | --- | --- | --- | --- |
| DB bootstrap | `apps/api/src/main.ts` | env + prisma | db ready | limited-mode 分支未单独验证 |
| cross-module composition | `apps/api/src/main.ts` | goal/task/reminder/notification repos | schedule source executor | 宿主层知道过多底层细节 |
| app bootstrap | `apps/api/src/bootstrap.ts` | registered modules | express app | 无直接测试覆盖 |
| runtime start | `apps/api/src/main.ts` | initialized app | cron + API online | 启动链回归只能靠集成感知 |

#### Flow C: Task Template HTTP Flow

```text
HTTP /api/v1/task-templates
↓
packages/task/src/api/routes/*
↓
TaskTemplateController
↓
Task transport handlers
↓
Task module API / use cases
↓
TaskTemplate aggregate + repositories
↓
DTO / Result 返回
```

| Stage | Owner | Input | Output | Risk |
| --- | --- | --- | --- | --- |
| route layer | `packages/task/src/api/routes/index.ts` | express req | controller call | 任务模块 route 装配风格与 goal/schedule 不同 |
| controller layer | `task-template.controller.ts` | unknown payload + context | validated internal input | 控制器 port 依赖 `.execute()` 形状 |
| application layer | `createTaskModule(...).api` | parsed input | domain mutation/query | transport contract 形状和别的模块不统一 |
| domain layer | `TaskTemplate` | state + policy | aggregate result/events | 核心聚合存在循环依赖 |

#### Flow D: Schedule Projection and Execution

```text
task / goal / reminder 业务事件
↓
各自的 create*ScheduleRuntimeContribution()
↓
删除旧 schedule task / 重建投影 / 发送 schedule:task-deleted
↓
packages/schedule/src/api/runtime.ts queue sync
↓
sourceExecutor.execute(task)
↓
通知创建 / 业务副作用 / execution 状态持久化
```

| Stage | Owner | Input | Output | Risk |
| --- | --- | --- | --- | --- |
| event subscription | `task|goal|reminder/src/api/schedule-runtime.ts` | 领域事件 | projection sync | 三处重复维护，规则易漂移 |
| queue sync | `packages/schedule/src/api/runtime.ts` | schedule task repo | in-memory queue | 缺少 direct runtime tests |
| execution | `sourceExecutor` | due task | notification / next run | sourceExecutor 装配发生在 API 顶层 |
| persistence | schedule repo | execution result | updated task state | 异常路径只有局部测试 |

#### Flow E: Desktop Main Window and Runtime Lifecycle

```text
Electron 主进程启动
↓
apps/desktop/src/main/main.ts
↓
WindowManager / profile runtime manager
↓
登录窗口 or 主窗口
↓
schedule runtime start/stop
↓
主窗口关闭或 profile 切换
↓
runtime teardown
```

| Stage | Owner | Input | Output | Risk |
| --- | --- | --- | --- | --- |
| host composition | `apps/desktop/src/main/main.ts` | Electron app lifecycle | bootstrapper + modules | 组合较重，需靠主进程测试保护 |
| window transition | `window-manager.ts` | auth/profile state | login/main window | 与 schedule runtime 的协作缺少直接覆盖 |
| runtime control | `@dailyuse/schedule/electron-entry` | active profile | scoped schedule runtime | 只有 mock 级覆盖，没有真实链路测试 |

## 3. Responsibility Boundaries

| Boundary | Intended Owner | Current State | Evidence | Risk |
| --- | --- | --- | --- | --- |
| API host vs domain packages | `apps/api` 只注册模块 | 已越界 | `apps/api/src/main.ts:107-123` 直接创建跨模块 repo 和 use case，再装配 `createSharedSourceExecutor` | 宿主层成为跨域知识中心 |
| Domain aggregate vs helper modules | `TaskTemplate` 自己维护稳定核心 | 已松动 | `packages/task/src/domain-server/aggregates/task-template.ts:774-793` 与 `task-template-factory.ts:27` 相互依赖 | 核心聚合结构脆弱 |
| Schedule ownership | `packages/schedule` 应该拥有统一调度事实来源 | 已分散 | `task/goal/reminder` 各自定义 `create*ScheduleRuntimeContribution()` | 调度规则多来源 |
| Transport contract | 各模块 controller/use-case seam 应统一 | 不统一 | `goal` 需要包装成 `{ execute }`，`task` 直接映射对象字段，`schedule` 直接透传 | 适配层重复、共享约定难沉淀 |
| Web bootstrap vs service registry | `bootstrap/app.ts` 应以稳定入口组装主壳 | 分散 | `main.ts`、`bootstrap/app.ts`、`di-app.ts`、`http.ts` 共同维持启动约定 | 新人不易追踪全链路 |
| Test suite vs critical runtime seams | 核心启动链应有直接测试 | 缺口明显 | 对 `ApiBootstrapper`、`bootstrapMainApp`、`createScheduleRuntimeContribution` 等符号的测试搜索无匹配 | 回归只能靠手测或间接用例暴露 |

## 4. Critical Findings

### Q-001

- **Severity:** High
- **Location:** `apps/api/src/main.ts:23-35`, `apps/api/src/main.ts:105-142`
- **Impact:** API 顶层启动代码已经不只是“注册模块”，而是在宿主层拼装 `goal/task/reminder/notification/schedule` 的内部依赖。这让调度和通知的核心协作规则无法在单一模块内收敛，后续改动需要同时理解多个包。
- **Evidence:** 注释宣称模块“自治”，但实现中直接调用 `createGoalPrismaRepositories`、`createTaskPrismaRepositories`、`createReminderPrismaRepositories`、`createNotificationPrismaRepositories`，并用这些依赖手工构造 `createSharedSourceExecutor(...)` 后再传给 `createScheduleApiModule(...)`。
- **Suggested Repair Direction:** 把 schedule source executor 的跨域装配下沉到专门的组合根或 schedule/notification 侧的显式模块工厂，让 `apps/api/src/main.ts` 回到只知道“注册哪个模块/工厂”的层级。
- **Recommended Verification:** `.\node_modules\.bin\nx.cmd run api:test --outputStyle=static` 和 `.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static`

### Q-002

- **Severity:** High
- **Location:** `packages/task/src/domain-server/aggregates/task-template.ts:35-39`, `packages/task/src/domain-server/aggregates/task-template.ts:772-793`, `packages/task/src/domain-server/aggregates/task-template-factory.ts:27`
- **Impact:** `TaskTemplate` 是任务域的核心聚合，但当前结构已经出现真实循环依赖，并且通过 lazy import 躲避模块加载问题。这个状态下继续演进任务模板相关功能，容易引入更隐蔽的初始化和维护问题。
- **Evidence:** `task-template.ts` 同时依赖 DTO helper、goal/lifecycle/onetime/recurrence policy 与 factory；文件底部写明 `Lazy import to avoid circular dependency at module load time`；`task-template-factory.ts` 又反向导入 `TaskTemplate`；`madge` 检出 6 个以 `task-template.ts` 为中心的循环依赖。
- **Suggested Repair Direction:** 先拆出真正纯函数的规则层或 builder/state factory，避免 helper/factory/policy 反向依赖聚合本身。修复前应先加失败测试或依赖图守护，保证循环不会回归。
- **Recommended Verification:** `.\node_modules\.bin\madge.cmd --circular --extensions ts packages/task/src/index.ts` 和 `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`

## 5. Full Findings

### Q-001

- **严重级别：** High
- **类型：** 架构
- **位置：** `apps/api/src/main.ts` `bootstrap()` `23-35`, `105-142`
- **现象：** 顶层入口既导入模块，又导入具体仓储工厂和 `CreateNotificationUseCase`，再手工构造 `createSharedSourceExecutor(...)` 传给 schedule 模块。
- **影响：** 宿主层理解了多个模块的内部拼装细节，导致调度、通知、任务、目标、提醒之间的变化无法局部化。
- **证据：**
  - `apps/api/src/main.ts:23-35` 同时导入 `GoalApiModule`、`NotificationApiModule`、`ReminderApiModule`、`TaskApiModule` 以及 `create*PrismaRepositories`、`CreateNotificationUseCase`、`createSharedSourceExecutor`。
  - `apps/api/src/main.ts:107-123` 直接创建四组 repo，并把它们拼成 `scheduleApiModule`。
  - `apps/api/src/main.ts:125-142` 最后才把这个手工装配出来的 schedule 模块注册进 bootstrapper。
- **建议：** 将跨模块 `sourceExecutor` 装配迁移到专用模块工厂，或让 schedule 模块接收更稳定的高层端口，而不是在 API 顶层拉通底层 repo。
- **是否需要测试：** 需要
- **推荐测试位置：** `apps/api/src/bootstrap.spec.ts` 或 `apps/api/src/main.spec.ts`
- **验证方式：** `.\node_modules\.bin\nx.cmd run api:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static`

### Q-002

- **严重级别：** High
- **类型：** 质量 / 架构
- **位置：** `packages/task/src/domain-server/aggregates/task-template.ts` `35-39`, `130-138`, `772-793`；`packages/task/src/domain-server/aggregates/task-template-factory.ts` `27-32`
- **现象：** 核心聚合把 DTO helper、多个 policy、factory 都拉进来，factory 又反向依赖聚合；文件底部靠 lazy import 规避循环加载。
- **影响：** `TaskTemplate` 的抽象边界不稳定，工具链、依赖图、后续重构都会被真实循环依赖拖慢；未来任何模板功能修改都可能意外碰到模块初始化顺序问题。
- **证据：**
  - `packages/task/src/domain-server/aggregates/task-template.ts:35-39` 同时依赖 `task-template-dto` 和多种 policy helper。
  - `packages/task/src/domain-server/aggregates/task-template.ts:774-785` 静态工厂方法全部转发给 `factory.*`。
  - `packages/task/src/domain-server/aggregates/task-template.ts:792-793` 明确写有 `Lazy import to avoid circular dependency at module load time`。
  - `packages/task/src/domain-server/aggregates/task-template-factory.ts:27` 反向导入 `TaskTemplate`。
  - `madge` 扫描结果显示 6 个循环依赖，全部以 `task-template.ts` 为中心。
- **建议：** 先定义清楚聚合自身、state builder、policy 纯函数、DTO mapper 的边界，再做最小拆分；不要继续在循环结构上堆新 helper。
- **是否需要测试：** 需要
- **推荐测试位置：** `packages/task/src/domain-server/aggregates/__tests__/` 和依赖图校验脚本
- **验证方式：** `.\node_modules\.bin\madge.cmd --circular --extensions ts packages/task/src/index.ts`；`.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`

### Q-003

- **严重级别：** Medium
- **类型：** 一致性 / 架构
- **位置：** `packages/goal/src/api/transport-handlers.ts:21-28`, `28-86`；`packages/task/src/api/transport-handlers.ts:22-76`；`packages/schedule/src/api/transport-handlers.ts:22-28`；`packages/schedule/src/controllers/schedule.controller.ts:28-43`；`packages/task/src/controllers/task-template.controller.ts:49-64`；`packages/goal/src/controllers/goal.controller.ts:72-80`
- **现象：** 同一层的 controller/use-case seam 在不同模块里形状不同。`goal` 需要把 plain function 包成 `{ execute }`，`task` 直接映射为“use case 对象字段”，`schedule` 则要求 `ScheduleApplicationPort` 与 `ScheduleUseCases` 同形并直接透传。
- **影响：** 共享 adapter 约定无法沉淀，transport handler 变成模块私有样板；新增模块时很难复用一致的 controller contract。
- **证据：**
  - `packages/goal/src/api/transport-handlers.ts:21-26` 直接说明“Controllers expect use-case objects with `.execute(...)` methods”。
  - `packages/task/src/api/transport-handlers.ts:37-75` 返回的是分组对象，字段值直接来自 `api.*`。
  - `packages/schedule/src/api/transport-handlers.ts:22-27` 说明 “shape 相同，直接透传即可”。
- **建议：** 统一 controller port 约定。优先选择一种稳定形状，例如全部使用 plain function port，或者全部使用 `{ execute }` 对象，再用共享 adapter helper 承接。
- **是否需要测试：** 需要
- **推荐测试位置：** 各模块 `src/api/*transport*.spec.ts`，或抽出共享 contract test
- **验证方式：** `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run goal:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`

### Q-004

- **严重级别：** Medium
- **类型：** 架构 / 一致性
- **位置：** `packages/task/src/api/module.ts:64-79`；`packages/goal/src/api/module.ts:51-58`；`packages/reminder/src/api/module.ts:58-66`；`packages/task/src/api/schedule-runtime.ts:178-255`, `258-342`；`packages/goal/src/api/schedule-runtime.ts:74-199`；`packages/reminder/src/api/schedule-runtime.ts:12-164`
- **现象：** 任务、目标、提醒都各自维护一份“业务事件 -> schedule task 投影”的 runtime 贡献。三处代码都负责查旧任务、删除、发送 `schedule:task-deleted`、重建投影并订阅各自事件。
- **影响：** “调度任务从哪里来” 没有单一事实来源，规则变更会跨三处散落修改；不同模块之间已经出现实现差异，例如时区默认值和日志/事件处理方式不统一。
- **证据：**
  - `packages/task/src/api/module.ts:71-78`、`packages/goal/src/api/module.ts:52-57`、`packages/reminder/src/api/module.ts:63-66` 都把各自的 `create*ScheduleRuntimeContribution()` 挂进模块 runtime。
  - `packages/task/src/api/schedule-runtime.ts:172-190` 和 `packages/goal/src/api/schedule-runtime.ts:88-91`、`packages/reminder/src/api/schedule-runtime.ts:33-36`, `95-98` 都在删除后发送 `schedule:task-deleted`。
  - `packages/task/src/api/schedule-runtime.ts:225-228` 与 `packages/goal/src/api/schedule-runtime.ts:122-125` 直接写死 `'Asia/Shanghai'`；`packages/reminder/src/api/schedule-runtime.ts:60-63` 则使用 `template.trigger.fixedTime.timezone` 或 `Timezone.Shanghai`。
  - 对 `createTaskScheduleRuntimeContribution`、`createGoalScheduleRuntimeContribution`、`createReminderScheduleRuntimeContribution` 的测试搜索无匹配。
- **建议：** 先把共同投影规则抽成稳定 contract 或 shared helper，再让各模块只提供 source-specific 数据映射；不要继续复制事件监听和删建逻辑。
- **是否需要测试：** 需要
- **推荐测试位置：** `packages/task/src/api/schedule-runtime.spec.ts`、`packages/goal/src/api/schedule-runtime.spec.ts`、`packages/reminder/src/api/schedule-runtime.spec.ts`、`packages/schedule/src/api/runtime.integration.spec.ts`
- **验证方式：** `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run goal:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`

### Q-005

- **严重级别：** Medium
- **类型：** 质量
- **位置：** `packages/task/src/api/runtime.ts:21-29`；`packages/task/src/api/schedule-runtime.ts:4-12`；`packages/task/src/application-server/use-cases/commands/delete-task-instance.use-case.ts:10-11`
- **现象：** 为了绕开泛型约束，任务模块的运行时和 use case 都把 `eventBus` 强制转换成基于 `string` 和 `unknown` 的松散接口。
- **影响：** 事件名和 payload 失去静态校验，任务运行时、任务实例删除、schedule 投影这些关键路径都在绕过现有事件类型体系。
- **证据：**
  - `packages/task/src/api/runtime.ts:21-29` 定义松散的 `on/off(event: string, handler: (event: unknown) => void)`。
  - `packages/task/src/api/schedule-runtime.ts:8-12` 继续把同一个 bus 扩成 `on/off/send` 的字符串接口。
  - `packages/task/src/application-server/use-cases/commands/delete-task-instance.use-case.ts:10-11` 再次定义 `send(event: string, payload: unknown): void`。
- **建议：** 收敛出 typed event-bus adapter，或在 `@dailyuse/utils/domain` 侧补齐泛型能力；修复时避免再引入新的 `unknown as { send(...) }`。
- **是否需要测试：** 需要
- **推荐测试位置：** `packages/task/src/api/runtime.spec.ts` 和任务事件契约测试
- **验证方式：** `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run task:typecheck --outputStyle=static`

### Q-006

- **严重级别：** Medium
- **类型：** 测试 / 一致性
- **位置：** `packages/task/src/testing/task-smoke-app.ts:26-28`；`packages/task/src/infrastructure-server/adapters/prisma/mappers/prisma-task-template-mapper.spec.ts:7-9`, `53-63`；`packages/schedule/src/infrastructure-server/adapters/prisma/mappers/prisma-schedule-task-mapper.spec.ts:20-25`
- **现象：** 多组测试 fixture 使用 `template-1`、`task-1`、`identity-1`、`IdentityId_smoke-user-0001` 这类不满足当前 branded ID 约束的值，导致测试通过但持续向 stderr 打警告。
- **影响：** 测试不再准确表达真实数据契约，stderr 噪声掩盖真正问题，也会让“契约是否被破坏”变得难判断。
- **证据：**
  - `packages/task/src/testing/task-smoke-app.ts:27` 定义 `TEST_IDENTITY_ID = 'IdentityId_smoke-user-0001'`。
  - `packages/task/src/controllers/__tests__/task-template.controller.test.ts:47` 同时又使用了符合格式的 `IdentityId_550e8400-e29b-41d4-a716-446655440000`，说明测试数据策略并不一致。
  - `packages/task/src/infrastructure-server/adapters/prisma/mappers/prisma-task-template-mapper.spec.ts:8-9` 使用 `template-1` 和 `identity-1`。
  - `packages/schedule/src/infrastructure-server/adapters/prisma/mappers/prisma-schedule-task-mapper.spec.ts:23-24` 使用 `task-1` 和 `identity-1`。
  - 实际运行 `.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static` 输出 `ID IdentityId_smoke-user-0001 is not in expected "Prefix_uuid" format`。
  - 实际运行 `.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static` 输出多条 `ID schedule-1`、`ID task-1` 不符合 `"Prefix_uuid"` 的警告。
- **建议：** 统一从共享 fixture/generator 生成 branded ID；先清理最常用 smoke/mappers fixture，再扩散到其他模块。
- **是否需要测试：** 需要
- **推荐测试位置：** 现有 smoke/mappers/controller tests 所在目录
- **验证方式：** `.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`

### Q-007

- **严重级别：** Low
- **类型：** 测试
- **位置：** `packages/schedule/src/application-server/use-cases/commands/schedule-command-use-cases.test.ts:228-231`
- **现象：** 测试对象字面量中 `updateDescription` 被定义了两次。
- **影响：** 这是现成的测试噪声，也说明该测试对象并非按预期构造；同类问题会让 mock 行为与作者预期不一致。
- **证据：**
  - 文件中存在重复键：
    - `updateDescription: vi.fn(),`
    - `updateDescription: vi.fn(),`
  - 运行 `.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static` 时 Vite 输出 `Duplicate key "updateDescription" in object literal`。
- **建议：** 清理重复键，确保 mock shape 和真实对象 shape 对齐。
- **是否需要测试：** 不需要
- **推荐测试位置：** 不适用
- **验证方式：** `.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`

### Q-008

- **严重级别：** Medium
- **类型：** 测试 / 架构
- **位置：** `apps/api/src/bootstrap.ts:30-131`；`apps/web/src/bootstrap/app.ts:19-60`；`packages/schedule/src/api/runtime.ts:193-220`；`apps/desktop/src/main/lifecycle/window-manager.ts:77-122`
- **现象：** 核心启动链、runtime contribution 链和桌面端 runtime 生命周期都承担关键职责，但没有找到对应的直接测试。
- **影响：** 这些地方一旦回归，通常不会在单个 use-case 测试里暴露，只能靠 smoke、人工联调或生产行为察觉。
- **证据：**
  - 对 `createTaskRuntimeContribution|createTaskScheduleRuntimeContribution|createGoalRuntimeContribution|createGoalScheduleRuntimeContribution|createReminderScheduleRuntimeContribution` 的测试搜索无匹配。
  - 对 `createScheduleRuntimeContribution|ApiBootstrapper|bootstrapMainApp` 的测试搜索无匹配。
  - 当前仅发现 `apps/desktop/src/main/profile/DesktopProfileRuntimeManager.spec.ts:17`, `52-54` mock 了 `stopScheduleRuntime`，但并未覆盖窗口切换到 runtime 启停的真实流程。
- **建议：** 先补“宿主启动/运行时链路”测试，而不是继续只补叶子 use case。优先覆盖 API bootstrap、schedule runtime、web main bootstrap 三条链。
- **是否需要测试：** 需要
- **推荐测试位置：** `apps/api/src/bootstrap.spec.ts`、`apps/web/src/bootstrap/app.spec.ts`、`packages/schedule/src/api/runtime.spec.ts`、`apps/desktop/src/main/lifecycle/window-manager.spec.ts`
- **验证方式：** `.\node_modules\.bin\nx.cmd run api:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run web:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run desktop:test:main --outputStyle=static`

## 6. Consistency Matrix

| 概念 / 规则 / 数据 | 位置 A | 位置 B | 位置 C | 不一致表现 | 风险 | 建议统一方式 |
| --- | --- | --- | --- | --- | --- | --- |
| Controller/use-case seam 形状 | `packages/task/src/api/transport-handlers.ts` | `packages/goal/src/api/transport-handlers.ts` | `packages/schedule/src/api/transport-handlers.ts` | `task` 直接映射字段，`goal` 包成 `{ execute }`，`schedule` 直接透传 | 适配层重复，约定难复用 | 统一 controller port 形状，并提供共享 adapter helper |
| Schedule projection owner | `packages/task/src/api/schedule-runtime.ts` | `packages/goal/src/api/schedule-runtime.ts` | `packages/reminder/src/api/schedule-runtime.ts` | 同一核心流程由三个模块各自维护 | 规则散落，多来源事实 | 提取共享 projection contract，source-specific 部分只保留差异 |
| Schedule timezone 默认值 | `task` `timezone: 'Asia/Shanghai'` | `goal` `timezone: 'Asia/Shanghai'` | `reminder` `Timezone.of(...)` / `Timezone.Shanghai` | 有的写死字符串，有的走值对象/模板配置 | 规则漂移，扩展多时区困难 | 统一由 schedule/domain-shared 提供默认值与转换函数 |
| ID fixture 策略 | `packages/task/src/testing/task-smoke-app.ts` | `packages/task/src/controllers/__tests__/task-template.controller.test.ts` | `packages/schedule/src/infrastructure-server/adapters/prisma/mappers/*.spec.ts` | 有的用合法 branded ID，有的用裸字符串 | 测试与真实契约脱节 | 统一通过 fixture builder / `anIdentityId()` 风格生成 |
| Route registration 风格 | `packages/task/src/api/routes/index.ts` | `packages/goal/src/api/routes/index.ts` | `packages/schedule/src/api/routes.ts` | `task` 直接改写 root router，`goal` 返回 router，`schedule` 还内嵌 OpenAPI route registrar | 新人难以预测模块 API 写法 | 统一 route registration 约定，并为 OpenAPI 场景定义可复用包装层 |
| 命名一致性 | `registerGoalFolderRoutes_` | `registerGoalRoutes` | `registerTaskRoutes` | `goal` 存在带下划线的异常导出 | 可读性与 discoverability 降低 | 移除特殊命名，遵循单一导出风格 |
| 启动链测试覆盖 | `apps/api/src/bootstrap.ts` | `apps/web/src/bootstrap/app.ts` | `packages/schedule/src/api/runtime.ts` | 叶子用例有测试，启动/运行时链路基本无测试 | 核心流程只能靠间接回归发现 | 增加 bootstrap/runtime 级集成测试 |

## 7. Testing Gaps

| 测试缺口 | 风险 | 建议测试类型 | 推荐测试位置 | 优先级 | 验证命令 |
| --- | --- | --- | --- | --- | --- |
| API bootstrap 注册与错误处理链未直接覆盖 | 模块注册顺序、middleware、挂载路径回归不易及时发现 | 集成测试 | `apps/api/src/bootstrap.spec.ts` | P1 | `.\node_modules\.bin\nx.cmd run api:test --outputStyle=static` |
| Web main bootstrap 与 DI/http/auth 协作未直接覆盖 | tokenProvider、logout、startup hook、服务注入的隐式时序可能回归 | 集成测试 | `apps/web/src/bootstrap/app.spec.ts`, `apps/web/src/platform/*.spec.ts` | P1 | `.\node_modules\.bin\nx.cmd run web:test --outputStyle=static` |
| `task/goal/reminder -> schedule` 投影链无 direct tests | schedule task 删建规则和事件订阅易漂移 | 集成测试 + 回归测试 | `packages/task/src/api/schedule-runtime.spec.ts`, `packages/goal/src/api/schedule-runtime.spec.ts`, `packages/reminder/src/api/schedule-runtime.spec.ts` | P1 | `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run goal:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run reminder:test --outputStyle=static` |
| `packages/schedule/src/api/runtime.ts` 队列同步与执行链缺少 direct tests | shouldScheduleTask、失败重试、删除后移出队列等逻辑可能只靠间接行为暴露 | 集成测试 | `packages/schedule/src/api/runtime.spec.ts` | P1 | `.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static` |
| Desktop 窗口切换与 schedule runtime 生命周期未直接覆盖 | 登录/主窗口切换、profile 切换时 runtime 泄漏或未启动难被发现 | 主进程集成测试 | `apps/desktop/src/main/lifecycle/window-manager.spec.ts` | P2 | `.\node_modules\.bin\nx.cmd run desktop:test:main --outputStyle=static` |
| ID contract 只在运行时警告，没有 fixture-level guard | 新测试继续引入非法 ID 仍会通过 | 单元测试 / 契约测试 | `packages/task/src/testing/*.spec.ts`, mapper specs | P2 | `.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static` |
| 现有测试大量只覆盖 happy path 的路由/mapper/use-case 组合 | 异常路径、跨模块行为、队列运行时保护不足 | 回归测试 | 各 runtime/bootstrap 相关目录 | P2 | 视修复点选择对应 target |

## 8. Recommended Repair Plan

### Repair Pass 01：修复 Q-002

- **目标：** 先去掉 `TaskTemplate` 的循环依赖与 lazy import hack。
- **涉及文件：** `packages/task/src/domain-server/aggregates/task-template.ts`，相关 factory/policy/dto helper
- **为什么优先：** 这是核心聚合，且已经存在真实结构性循环，继续在其上叠加功能风险最大。
- **推荐步骤：**
  1. 补失败测试或依赖图守护，确保循环依赖可被检测出来。
  2. 收敛 `TaskTemplate` 与 factory/policy/dto helper 的边界。
  3. 去掉 lazy import 和反向依赖。
  4. 运行 targeted verification。
  5. 更新报告状态。
- **验证命令：** `.\node_modules\.bin\madge.cmd --circular --extensions ts packages/task/src/index.ts`；`.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`

### Repair Pass 02：修复 Q-001

- **目标：** 把 API 顶层跨模块装配缩回稳定组合根边界。
- **涉及文件：** `apps/api/src/main.ts`，与 schedule source executor 装配相关的模块工厂
- **为什么优先：** 当前宿主层是多个核心模块的知识汇总点，后续调度/通知改动都会首先撞到这里。
- **推荐步骤：**
  1. 补一个 API bootstrap 级失败测试，锁定模块注册与 source executor 装配行为。
  2. 下沉跨模块装配到更合适的模块工厂。
  3. 确保 `main.ts` 只保留高层注册逻辑。
  4. 运行 targeted verification。
  5. 更新报告状态。
- **验证命令：** `.\node_modules\.bin\nx.cmd run api:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static`

### Repair Pass 03：修复 Q-004

- **目标：** 收敛 schedule projection 的共同规则，减少多来源事实。
- **涉及文件：** `packages/task/src/api/schedule-runtime.ts`，`packages/goal/src/api/schedule-runtime.ts`，`packages/reminder/src/api/schedule-runtime.ts`，必要时共享 helper
- **为什么优先：** 这是跨域流程，规则分散且没有直接测试，最容易在“改一处漏两处”。
- **推荐步骤：**
  1. 先补三类投影链的失败测试。
  2. 提取重复的删建/删除事件/默认时区逻辑。
  3. 保留 source-specific 的差异映射。
  4. 运行 targeted verification。
  5. 更新报告状态。
- **验证命令：** `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run goal:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run reminder:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`

### Repair Pass 04：修复 Q-006

- **目标：** 统一测试 ID fixture，消除“通过但持续报契约警告”的状态。
- **涉及文件：** `packages/task/src/testing/task-smoke-app.ts`，task/schedule mapper specs，其他复用非法 ID 的测试
- **为什么优先：** 这是低风险高收益修复，能显著提升测试信噪比，也能防止后续误用 fixture。
- **推荐步骤：**
  1. 先补 fixture-level guard 或直接把 smoke/mappers 改为合法 branded ID。
  2. 统一替换共享测试常量。
  3. 清理 stderr warning。
  4. 运行 targeted verification。
  5. 更新报告状态。
- **验证命令：** `.\node_modules\.bin\nx.cmd run api:test:smoke --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`

### Repair Pass 05：修复 Q-008

- **目标：** 给启动链和 runtime 链补直接测试保护。
- **涉及文件：** `apps/api/src/bootstrap.ts`，`apps/web/src/bootstrap/app.ts`，`packages/schedule/src/api/runtime.ts`，`apps/desktop/src/main/lifecycle/window-manager.ts`
- **为什么优先：** 这些都是“坏了以后很晚才知道”的位置，应该尽快建立守护。
- **推荐步骤：**
  1. 为 API bootstrap、schedule runtime、web app bootstrap 先补失败测试。
  2. 再根据暴露的问题决定是否修复实现。
  3. 运行 targeted verification。
  4. 更新报告状态。
- **验证命令：** `.\node_modules\.bin\nx.cmd run api:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run web:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run desktop:test:main --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`

### Repair Pass 06：修复 Q-003 和 Q-005

- **目标：** 在不扩散修改面的前提下，统一 transport contract 与 typed event-bus 边界。
- **涉及文件：** task/goal/schedule transport handlers，task runtime/event use case 边界
- **为什么优先：** 这两类问题会持续制造样板和类型绕过，但适合在高风险问题收敛后再做。
- **推荐步骤：**
  1. 先为当前 seam 形状补 contract tests。
  2. 统一一层约定，再替换字符串事件 cast。
  3. 运行 targeted verification。
  4. 更新报告状态。
- **验证命令：** `.\node_modules\.bin\nx.cmd run task:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run goal:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run schedule:test --outputStyle=static`；`.\node_modules\.bin\nx.cmd run task:typecheck --outputStyle=static`

## 9. Suggested Follow-up Prompts

- `请只针对 Q-002 做一个 focused repair pass。先补能暴露 TaskTemplate 循环依赖问题的失败测试或依赖图守护，再做最小修复，不要顺手重构别的模块。修复后运行 madge 和 task:test。`
- `请只针对 Q-001 收敛 apps/api/src/main.ts 的跨模块装配边界。先补 API bootstrap 级测试，再把 schedule source executor 的装配下沉到更稳定的模块工厂。`
- `请只针对 Q-004 处理 schedule projection 分散的问题。先补 task/goal/reminder 三条投影链的失败测试，再抽取重复的删建逻辑与默认时区约定。`
- `请只针对 Q-006 清理测试 fixture 的 branded ID 不一致。不要修改业务代码，只替换测试数据和测试辅助函数，并确保 api:test:smoke 与 schedule:test 不再输出 ID 格式警告。`
- `请为 Q-008 补测试，不改实现。优先给 ApiBootstrapper、bootstrapMainApp 和 createScheduleRuntimeContribution 增加 direct tests，帮助我们先锁住当前行为。`
- `请基于本报告的 Consistency Matrix，只做 transport contract 一致性收敛方案设计，不写代码。输出一个最小改动方案，明确 task/goal/schedule 应统一成哪种 controller/use-case seam。`
