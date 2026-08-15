---
tags:
  - plan
  - active
  - architecture
  - reference-architecture
  - layering
  - p0
description: Reference architecture phase 1: remove the remaining Application-to-Prisma layering inversions / 参考架构阶段 1：修正剩余 Application 到 Prisma 的层反转
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
---

# Reference Architecture Phase 1: P0 Layering Inversions / 参考架构阶段 1：P0 层反转

## 文档状态

- **状态**：Active，read-only implementation plan；本文只描述实施，不在本轮修改生产代码、测试或既有文档。
- **基线**：以当前 `main` 工作树的代码、配置和测试为真值。阶段 0 已建立基线，阶段 3 的 host composition root externalization 已完成；当前 API 组合入口使用 `apps/api/src/runtime/compose-*.ts`。
- **依据**：
  - `docs/analysis/2026-08-13-architecture-refactor-review.md`：§1 items 3/7、§3.3、§3.9、§4 P0/P1 candidate rows、§6 阶段 1。
  - `docs/analysis/reference-architecture-source-notes.md`：Ardan consumer-owned Port 与 runtime composition root、Memos transport/service separation 的源码核验。
  - 当前 Goal、Data Portability、API runtime、governance audit 实现与现有 surface/unit/integration tests。

## 1. 目标与非目标

### 1.1 目标

本阶段只处理评审 §6「阶段 1：修正明确层反转」的最高价值切片，拆为四个可独立审查、可回滚的 PR steps：

1. **Goal relation/wallet（P0）**：`IRelationRepository` 与 `IWalletRepository` 成为 domain-owned Port；Application use case 只依赖 Port；Prisma mapper/repository 移到 `server/infrastructure/adapters/prisma`；通过 Goal module/composer 注入 adapter。
2. **Data Portability adapters（P1，纳入阶段 1）**：Prisma export/read adapters 与 Prisma import store 从 `server/application` 归位到 `server/infrastructure`；Application 保留 import/read Port、use case 与 `DataPortabilityApplicationPort`。
3. **AI backend executor（P0）**：API runtime 通过 `compose-goal.ts`、`compose-task.ts`、`compose-reminder.ts` 取得已组装的 Goal/Task/Reminder Application Ports；`BackendAutomationToolExecutorAdapter` 只编排这些 Port 及已有 read Port，不再创建 Prisma module、读取 Prisma 或拥有 module lifecycle。
4. **Governance（P0 gate）**：完成 steps 1–2 后，启用 `server/domain/**` 与 `server/application/**` 禁止生产代码 import `@memoflow/database` 的 audit rule，并将治理检查作为后续 PR 的硬门禁。

### 1.2 非目标

- 不改变 `ExecutionContext` 或新增 request/execution context 字段。
- 不做 HTTP/IPC parity 重构；只保留现有共享 Application Port 与 transport 行为。
- 不引入 Query Cache、Pinia/server-state 迁移或新的前端状态架构。
- 不改变 AI executor 的 action loop、action ordering、dependency skip/failure policy、receipt 文本或事件触发语义；本阶段只替换依赖装配。
- 不改变数据库 schema、迁移、索引、Prisma transaction isolation、导入导出 payload、API/IPC 路由、认证或 OpenAPI surface。
- 不把 Goal relation/wallet 抽成新的 package，不改 ModuleManifest 的业务命令名称；只修正 Port ownership 与 adapter placement。
- 不处理其余跨模块 runtime adapter、request trace pipeline、Transport parity、cache 或后续阶段 2–6 项。

## 2. 当前状态盘点

### 2.1 Gap table

| 优先级 | 反转 / 现状                                                     | 证据（file:line）                                                                                                                                                                                                                            | 当前问题                                                                                                      | 阶段 1 目标                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0     | Goal relation use case 同文件包含 Port 与 Prisma implementation | `packages/goal/src/server/application/use-cases/commands/relation.use-cases.ts:9-11` import `PrismaClient`；`:32-44` 定义 `IRelationRepository`；`:46-112` 定义 `PrismaRelationRepository` 与 inline mapper                                  | Application 直接依赖 DB；Port 不能由第二种 persistence lane 复用；mapper 归属不清                             | `domain/repositories/i-relation-repository.ts` 只放 Port/DTO/type；`infrastructure/adapters/prisma/{relation-prisma.repository.ts,mappers/prisma-relation.mapper.ts}` 实现 Prisma lane          |
| P0     | Goal wallet use case 同文件包含 Port 与 Prisma implementation   | `packages/goal/src/server/application/use-cases/commands/wallet.use-cases.ts:8-10` import `PrismaClient`；`:30-48` 定义 `IWalletRepository`；`:50-156` 定义 Prisma repository；`:97-133` 内含 `$transaction`                                 | Application 持有 transaction、Decimal/Date row conversion；容易迁移时改变精度、错误和原子性                   | `domain/repositories/i-wallet-repository.ts` 只放 Port/DTO/type；`infrastructure/adapters/prisma/{wallet-prisma.repository.ts,mappers/prisma-wallet.mapper.ts}` 保留全部 DB 语义                |
| P0     | Goal module wiring 未拥有 relation/wallet repository dependency | `packages/goal/src/server/infrastructure/goal.module.ts:42-96` 的 `GoalModuleDependencies` 只有核心 Goal/Focus/Habit ports；`packages/goal/src/server/infrastructure/module-manifest.ts:8-20` 只接收 use case 类型                           | Prisma repository 虽存在，却没有明确的 deep-module injection seam                                             | 在 `GoalRepositorySet`/`GoalModuleDependencies` 增加可选 relation/wallet Port，Prisma composer 注入，PowerSync lane 不提供；不扩大 `GoalApplicationPort` 或路由 surface                         |
| P1     | Data Portability Prisma export/read adapters 位于 Application   | `packages/data-portability/src/server/application/prisma-adapters.ts:8-22,24-108` import `PrismaClient` 并实现各 read Port；`packages/data-portability/src/server/infrastructure/prisma.ts:1-18` 反向 import 这些 Application 文件           | Application 目录包含 persistence implementation，治理无法把 Application 视为纯 Port/use case                  | 移到 `server/infrastructure/adapters/prisma-adapters.ts`；`infrastructure/prisma.ts` 只从 infrastructure adapter 组装；`data-portability.dependencies.ts` 与 use cases 不变                     |
| P1     | Data Portability Prisma import store 位于 Application           | `packages/data-portability/src/server/application/import-store/prisma-data-portability-import-store.ts:8,42-44,218-225` import Prisma 并包装 `$transaction`；Application index `:13-16` 还从该目录导出 Port 类型                             | transaction implementation 泄漏到 Application；PowerSync 已位于 Infrastructure，目录不对称                    | 移到 `server/infrastructure/import-store/prisma-data-portability-import-store.ts`；Application `import-store/index.ts` 只导出 `DataPortabilityImportStore`/`DataPortabilityImportTx` 与输入类型 |
| P0     | AI backend executor 自己创建三套 feature Prisma module          | `apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts:23-28` import DB、`createGoalPrismaModule`、`createTaskPrismaModule`、`createReminderPrismaModule`；`:50-82` 构造 module、closure checker、knowledge/analytics adapters | executor 同时拥有跨模块 composition、DB 依赖和 action orchestration；重复 module instance/lifecycle，难以单测 | `apps/api/src/runtime/compose-ai.ts` 接收 Goal/Task/Reminder Application Ports；executor constructor 只接 Port/read adapters；action loop `:84-384` 保持原样                                    |
| P0     | Governance rule 尚未禁止 Application/Domain → database          | `tools/governance/package-internal-boundary-audit.mjs:25-65` 只检查 package 内层路径；Application forbidden list `:39-47` 没有 external `@memoflow/database`；当前生产 import inventory 正好是上述 Goal 两个文件与 Data Portability 两个文件 | 迁移前无法 fail closed；未来新增反转不会被治理捕获                                                            | steps 1–2 清空 production inventory 后，在同一 audit 增加 exact external-specifier rule；tests 仍按现有 `:166-170` 排除，Infrastructure 可正常 import DB                                        |

### 2.2 现有 host composition 约束

- `apps/api/src/runtime/compose-goal.ts:39-134`、`compose-task.ts:51-150`、`compose-reminder.ts:48-187` 已由 API runtime 选择 Prisma adapter 并创建 instance；Goal/Task composer 当前返回 API module handle，Reminder 已返回 `{ module, repositories, schedule... }`。
- `packages/goal/src/api/module.ts:13-31,101-130`、`packages/task/src/api/module.ts:13-30,105-134`、`packages/reminder/src/api/module.ts` 都是 instance-bound transport factories；它们只能消费 `instance.api`、挂载路由并管理 lifecycle，不应重新创建 module。
- `GoalApplicationPort`、`TaskApplicationPort`、`ReminderApplicationPort` 已分别定义在 `packages/goal/src/server/application/goal.application.port.ts:30-198`、`packages/task/src/server/application/task.application.port.ts:36-80`、`packages/reminder/src/server/application/reminder.application.port.ts:25-103`。这些接口是 AI executor 的目标依赖，不新增业务方法。
- `apps/api/src/main.ts:206-220` 当前先组装 Task、AI，之后才组装 Goal；实现时可以提前创建 Goal composed object 以提供 port，但注册顺序仍保持 `AI` 在 `Goal` 之前（`main.ts:221-233`），避免改变 bootstrap 行为。
- `packages/data-portability/src/server/infrastructure/prisma.ts:24-27,64-116` 已是 host-facing factory seam；移动实现文件不应改变 `compose-data-portability.ts:76-125` 的装配顺序。

## 3. 契约冻结（实现前必须先签字）

### 3.1 Goal relation/wallet Port

在 Step 1 开始前冻结以下 Port shape；新文件必须提供中英文 JSDoc，Application 只能 type-import：

```ts
// packages/goal/src/server/domain/repositories/i-relation-repository.ts
export interface IRelationRepository {
  create(input: {
    identityId: string;
    subject: SubjectRef;
    relationType: RelationType;
    object: SubjectRef;
  }): Promise<RelationDTO>;
  deleteByIdentityId(identityId: string, id: string): Promise<void>;
  findBySubject(identityId: string, subject: SubjectRef): Promise<RelationDTO[]>;
  findByObject(identityId: string, object: SubjectRef): Promise<RelationDTO[]>;
}

// packages/goal/src/server/domain/repositories/i-wallet-repository.ts
export interface IWalletRepository {
  createAccount(input: {
    identityId: string;
    name: string;
    currency?: string;
  }): Promise<WalletAccountDTO>;
  listAccounts(identityId: string): Promise<WalletAccountDTO[]>;
  recordTransaction(input: {
    identityId: string;
    accountId: string;
    type: 'income' | 'expense' | 'transfer';
    amount: string;
    category?: string | null;
    note?: string | null;
    goalId?: string | null;
    occurredAt?: number;
  }): Promise<WalletTransactionDTO>;
  listTransactions(identityId: string, limit?: number): Promise<WalletTransactionDTO[]>;
}
```

- `SubjectTypes`, `RelationTypes`, `SubjectRef`, `RelationDTO`, `WalletAccountDTO` 与 `WalletTransactionDTO` 的 exported names、literal unions、field optionality、timestamp unit 和 return `Promise` 均冻结；只移动 ownership，不改调用方签名。
- `IRelationRepository` 的 unique-error interpretation 继续在 `CreateRelationUseCase` 完成：message 含 `Unique` 仍返回 `CONFLICT / Relation already exists`；其它异常继续 throw。
- `IWalletRepository` 的 amount validation 与 `ACCOUNT_NOT_FOUND → NOT_FOUND` 映射继续在 use case 完成；repository 仍可抛出原始 `ACCOUNT_NOT_FOUND`。

### 3.2 Goal Prisma adapter semantics

- `relation-prisma.repository.ts` 只负责 Prisma calls；mapper 负责 `createdAt: Date → number (ms)` 与 persisted string enums → `SubjectType`/`RelationType`，`findBySubject`/`findByObject` 仍按 `createdAt ASC`，delete 仍是 `{ id, identityId }` scoped `deleteMany`。
- `wallet-prisma.repository.ts` 保留默认 currency `CNY`、所有 Decimal 字段 `.toString()`、所有 Date 字段 `.getTime()`；不得改成 `number` 或浮点 arithmetic。
- `recordTransaction` 必须保持一个 `db.$transaction(async tx => ...)`：先按 `{ id: accountId, identityId }` 查账户，缺失抛 `ACCOUNT_NOT_FOUND`，再按当前 `income/expense/transfer` delta 规则更新余额并创建 transaction。Step 1 不修正或重新解释既有 `transfer` 业务语义。
- `createGoalPrismaRepositories`/`createGoalPrismaModule` 是唯一 API Prisma wiring；relation/wallet repository 在此创建并注入 `createGoalModule`。PowerSync repository set 不伪造实现，保持 optional absent；`GoalApplicationPort` 不增加 relation/wallet 方法。

### 3.3 Data Portability contract

- `DataPortabilityImportStore.transaction(fn)` 与 `DataPortabilityImportTx` 的方法和 input types 原样保留；`PrismaDataPortabilityImportStore` 继续把整个 import callback 包在一个 `prisma.$transaction` 内（当前 `:221-225`）。
- `DataPortabilityDependencies`、`DataPortabilityApplicationPort.exportUserData/importUserData`、各 importer/projection 的顺序、filters、upsert/create 行为均冻结；只改 import path 与目录。
- `composeDataPortability` 的 wire order 仍是 `db → export dependencies → import store → disclosure port → module instance → API module`；不得因文件移动把 DB 读取回 Application。

### 3.4 AI Application Port and executor contract

- `GoalApplicationPort`、`TaskApplicationPort`、`ReminderApplicationPort` 使用现有 package root type exports；不新增方法、不改变 `Result`、`ExecutionContext`、identity 参数位置或 payload shape。
- `composeGoal`、`composeTask`、`composeReminder` 的 host-facing return shape 冻结为包含 `module` 与 `applicationPort: instance.api` 的 composed object；Reminder 的现有 `repositories`/schedule source properties 保留。新增 app-runtime exported interfaces 必须有中英文 JSDoc。
- `ComposeAIDependencies` 增加必需的 `goalApplicationPort`、`taskApplicationPort`、`reminderApplicationPort`；`composeAI` 用它们构造 executor。`db` 仍只供 API runtime 自己的 AI/knowledge/analytics infrastructure 使用。
- `BackendAutomationToolExecutorAdapter` constructor 冻结为依赖对象（Goal/Task/Reminder application ports + 已有 `IKnowledgeSourcePort` + `IAnalyticsReadPort`）；类不得 import `PrismaClient`、`create*PrismaModule` 或 `PrismaTaskBindingReadPort`。
- action loop 的 `for` 顺序、`createdGoalId`/key-result dependency maps、skip/fail receipts、logger fields、`continue` 分支和最终 actions array 必须逐项保持。Executor 只替换 `this.goalModule.api`/`this.taskModule.api`/`this.reminderModule.api` 为冻结的 ports；不在同一 PR 拆分 action executor。

## 4. 分步实施（PR-able steps）

### Step 1 — Goal relation/wallet repository migration（P0）

**目标**：Application 只持有 Port/use case；Prisma implementation、mapper、transaction 归 Infrastructure；Goal module 的 Prisma wiring 明确注入 adapter。

**精确文件清单**

- 新增 `packages/goal/src/server/domain/repositories/i-relation-repository.ts`、`i-wallet-repository.ts`；更新 `domain/repositories/index.ts`、`server/domain/index.ts`（若该 barrel 需要转出新 Port）。
- 修改 `packages/goal/src/server/application/use-cases/commands/relation.use-cases.ts`：删除 `PrismaClient`、`PrismaRelationRepository`、inline `toDTO`；从 domain repository barrel type-import `SubjectRef`、`RelationDTO`、`SubjectTypes`、`RelationTypes`、`IRelationRepository`，保留 validation、error code、use case method signatures。
- 修改 `packages/goal/src/server/application/use-cases/commands/wallet.use-cases.ts`：删除 `PrismaClient`、`PrismaWalletRepository`；从 domain repository barrel type-import DTO/Port，保留所有 validation/error handling。
- 新增 `packages/goal/src/server/infrastructure/adapters/prisma/relation-prisma.repository.ts`、`wallet-prisma.repository.ts`；新增 `adapters/prisma/mappers/prisma-relation.mapper.ts`、`prisma-wallet.mapper.ts`。mapper/repository 的 public exports 添加中英文 JSDoc，并由 `adapters/prisma/index.ts`/`mappers/index.ts` 内部导出。
- 修改 `packages/goal/src/server/infrastructure/prisma.ts`：`GoalRepositorySet` 增加可选 `relationRepository?: IRelationRepository`、`walletRepository?: IWalletRepository`；`createGoalPrismaRepositories(db)` 创建并返回 Prisma adapter；`createGoalPrismaModule` 把它们传入 `createGoalModule`。`createGoalPowerSyncRepositories` 保持缺省，不创建假 adapter。
- 修改 `packages/goal/src/server/infrastructure/goal.module.ts`：`GoalModuleDependencies` 接收可选 relation/wallet Port；`createGoalUseCases` 条件性组装 relation/list 与 wallet use cases；`GoalModuleUseCases` 保留可选分支供现有 ModuleManifest/低层测试使用；`GoalApplicationPort` 不变。
- 修改 `packages/goal/src/server/infrastructure/module-manifest.ts`、相关 server/root barrels 与 `packages/goal/src/index.ts`：更新 Port/use-case import path；只公开 Port/type 或既有 manifest seam，不公开 Prisma concrete class。所有新增 public type/function JSDoc 中英双语。
- 修改 `apps/api/src/runtime/compose-goal.ts`：透传 repository set 的 relation/wallet fields；不改变 module registration 路由或 listener/runtime contribution 顺序。

**测试与门禁**

- 更新 `packages/goal/src/server/application/use-cases/commands/__tests__/relation.use-cases.spec.ts`、`wallet.use-cases.spec.ts`：mock 从 domain Port import，保留 validation、unique conflict、reverse lookup、positive amount、account-not-found mapping assertions。
- 新增 `packages/goal/src/server/infrastructure/adapters/prisma/mappers/prisma-relation.mapper.spec.ts` 与 `prisma-wallet.mapper.spec.ts`：锁住 enum/timestamp/Decimal/string conversion。
- 新增 `packages/goal/src/server/infrastructure/adapters/prisma/relation-prisma.repository.integration.test.ts`、`wallet-prisma.repository.integration.test.ts`（使用现有 Goal integration database harness）：锁住 identity scoping、ASC/DESC ordering、唯一冲突、wallet 单 transaction 原子性与 Decimal 精度。
- 更新 `packages/goal/src/server/infrastructure/__tests__/goal-repositories.surface.spec.ts`、`apps/api/src/runtime/compose-goal.spec.ts`：断言 Prisma composer/module 接收到 relation/wallet Port；PowerSync lane 明确 absent；不创建第二个 module instance。
- 直接 Vitest gates（不得使用会 hang 的 `pnpm nx run <pkg>:test`）：
  - `node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.use-cases.config.ts`
  - `node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.mappers.config.ts`
  - `node node_modules/vitest/vitest.mjs run --config packages/goal/vitest.integration.config.ts`（需要数据库时执行）
  - `pnpm nx run goal:typecheck`、`pnpm nx run goal:lint`

**Step 1 完成条件**：`rg` 在 Goal `server/application`/`server/domain` 生产文件中找不到 `@memoflow/database`；Goal Application Port、ModuleManifest command names、error codes、transaction/Decimal semantics 与 baseline 对比无变化。

### Step 2 — Data Portability adapter placement（P1）

**目标**：只移动实现归属，保持 export/import cross-capability transaction behavior 与 Application contracts 完全相同。

**精确文件清单**

- 移动 `packages/data-portability/src/server/application/prisma-adapters.ts` → `packages/data-portability/src/server/infrastructure/adapters/prisma-adapters.ts`，保留 class names、Port implementations、query filters 和返回 row shape。
- 移动 `packages/data-portability/src/server/application/import-store/prisma-data-portability-import-store.ts` → `packages/data-portability/src/server/infrastructure/import-store/prisma-data-portability-import-store.ts`；新增/更新 `server/infrastructure/import-store/index.ts` 作为 infrastructure-internal barrel。
- 修改 `packages/data-portability/src/server/infrastructure/prisma.ts:1-18`：从新 infrastructure paths import Prisma adapters/import store；保持 `createPrismaDataPortabilityDependencies` 与 `createPrismaDataPortabilityImportStore` 的 function signatures。
- 修改 `packages/data-portability/src/server/application/import-store/index.ts`：删除 concrete Prisma export，只保留 `DataPortabilityImportStore`、`DataPortabilityImportTx` 与所有 input type exports。
- 检查并更新 `packages/data-portability/src/server/application/index.ts`、`server/infrastructure/index.ts`、`server/index.ts`、`packages/data-portability/package.json` exports；Application public surface 不得重新导出 concrete class，Infrastructure public surface 只保留现有 factory/Port shape。
- `packages/data-portability/src/server/application/data-portability.application.port.ts`、`data-portability.dependencies.ts`、全部 importer/projection/use case 不做逻辑修改；只在有必要时修正 type import。

**测试与门禁**

- 新增 `packages/data-portability/src/server/infrastructure/__tests__/prisma-adapters.surface.spec.ts`：断言 Prisma implementation 位于 infrastructure、Application 只出现 Port/use case import。
- 新增 `packages/data-portability/src/server/infrastructure/__tests__/prisma-data-portability-import-store.test.ts`：fake Prisma transaction client 验证 callback 只执行一次、所有 writes 仍在同一 `$transaction`。
- 保持并运行现有 `packages/data-portability/src/server/application/use-cases/__tests__/portable-runtime.test.ts`、import rejection、projection/ref-safety、`server/infrastructure/powersync/__tests__/powersync-round-trip.test.ts`；这些测试锁住 cross-capability export/import ordering、dry-run/rejection 和 PowerSync parity。
- 更新 `apps/api/src/runtime/compose-data-portability.spec.ts`：factory identity/装配顺序不变，禁止 API composer 从 Application concrete path import。
- 直接 Vitest gates：
  - `node node_modules/vitest/vitest.mjs run --config packages/data-portability/vitest.config.ts`
  - `node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts apps/api/src/runtime/compose-data-portability.spec.ts`
  - `pnpm nx run data-portability:typecheck`、`pnpm nx run data-portability:lint`

**Step 2 完成条件**：`rg` 只在 `server/infrastructure/**` 找到 Data Portability 的 `PrismaClient` import；import callback、transaction rollback/commit、export filters 与 PowerSync round-trip 与 baseline 一致。

### Step 3 — AI executor depends on Application Ports（P0）

**目标**：API runtime 只创建一次 Goal/Task/Reminder module instance；AI executor 不再创建 feature module 或持有 Prisma/lifecycle。

**精确文件清单**

- 修改 `apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts`：删除 `PrismaClient`、`createGoalPrismaModule`、`createTaskPrismaModule`、`createReminderPrismaModule`、`PrismaTaskBindingReadPort` imports；新增一个带双语 JSDoc 的 `BackendAutomationToolExecutorDependencies`，注入 `GoalApplicationPort`、`TaskApplicationPort`、`ReminderApplicationPort`、`IKnowledgeSourcePort`、`IAnalyticsReadPort`；保留类名、`executeGoalAutomation(input)` signature 与 action loop。
- 修改 `apps/api/src/runtime/compose-goal.ts`、`compose-task.ts`：返回 `{ module, applicationPort: instance.api }` composed object；Goal/Task 现有 module handle/lifecycle 只通过 `.module` 交给 bootstrap。不要暴露 Prisma repository 或完整 instance。
- 修改 `apps/api/src/runtime/compose-reminder.ts`：在现有 `ComposedReminder` 增加 `applicationPort: instance.api`，保留 `module`、repository view、schedule sources。
- 修改 `apps/api/src/runtime/compose-ai.ts`：`ComposeAIDependencies` 增加上述三个 Application Port；继续在 runtime 构造 `RepositoryKnowledgeSourceAdapter` 与 `ControlledAnalyticsReadAdapter`，用五个已注入 port 构造 executor；AI Prisma repository set、ai-service config branch、checkpoint pair 逻辑不变。
- 修改 `apps/api/src/main.ts`：在调用 `composeAI` 前得到 `goalComposed.applicationPort`、`taskComposed.applicationPort`、`reminderComposed.applicationPort`；保持 API 注册顺序与现有 `.module` handle 归属；不要在 main 新增第二个 `create*PrismaModule`。
- 更新 `apps/api/src/runtime/compose-goal.spec.ts`、`compose-task.spec.ts`、`compose-reminder.spec.ts`、`compose-ai.spec.ts`：断言返回的 applicationPort 是同一个 `instance.api`，且 AI executor 收到同一对象 identity。
- 更新 `apps/api/src/modules/ai/backend-automation-tool-executor.adapter.test.ts`：用 fake Application Ports 替换 package module mocks；保留成功 action 顺序、reviewed fields、goal failure dependency skip、receipt 内容与 unsupported action assertions。当前 closureChecker constructor test 移到 `compose-reminder.spec.ts` 或 API integration test，验证 closure checker 仍由 Reminder composer 注入，而非 executor 自己查询 account tables。
- 可新增 `apps/api/src/runtime/compose-ai.surface.spec.ts` 断言 executor 文件不含 `@memoflow/database`、`create*PrismaModule` 或 feature `/server` deep import；复用现有 package export audit 风格。

**测试与门禁**

- 直接 Vitest：
  - `node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts apps/api/src/modules/ai/backend-automation-tool-executor.adapter.test.ts`
  - `node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts apps/api/src/runtime/compose-goal.spec.ts apps/api/src/runtime/compose-task.spec.ts apps/api/src/runtime/compose-reminder.spec.ts apps/api/src/runtime/compose-ai.spec.ts`
  - `node node_modules/vitest/vitest.mjs run --config apps/api/vitest.smoke.config.ts`
- `pnpm nx run api:typecheck`、`pnpm nx run api:lint`；检查 `compose-ai`、API bootstrap 与 module destroy lifecycle。
- Inventory gates：
  - `rg -n "createGoalPrismaModule|createTaskPrismaModule|createReminderPrismaModule|@memoflow/database" apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts` 必须无匹配。
  - `rg -n "applicationPort" apps/api/src/runtime/compose-{goal,task,reminder,ai}.ts` 必须显示显式 port wiring，不能通过 module singleton/accessor 间接取得。

**Step 3 完成条件**：API、AI runtime 只拥有一套 feature module instance；executor action ordering/receipts/events 与 baseline fixtures 完全一致；AI service unavailable/config-null 分支不变。

### Step 4 — Enable forbidden `@memoflow/database` governance（P0 gate）

**目标**：在 steps 1–2 清空旧 violations 后，将 Application/Domain → database 变成 fail-closed 规则，允许 DB 依赖只出现在 infrastructure/runtime/test scope。

**精确文件清单**

- 修改 `tools/governance/package-internal-boundary-audit.mjs:25-65,178-194`：为 `server/domain` 与 `server/application` 增加 exact external specifier forbidden set `@memoflow/database`；扫描 `from`、dynamic `import()` 与 `import type`（现有 regex 已覆盖），错误包含 `file:line`、layer、specifier。
- 保持现有 test exclusion `:166-170`（`*.spec.ts`、`*.test.ts`、`__tests__`），不把 integration fixture 当作生产层反转；不要新增 Goal/Data Portability allowlist。`server/infrastructure/**` 不进入该 forbidden external rule。
- 新增 `tools/governance/__tests__/package-internal-boundary-audit.test.mjs` 或等价 source-scan fixture test：正例为 domain/application import contracts/utils，反例为 `import type { PrismaClient } from '@memoflow/database'`，并验证 test fixture exclusion；如需可测性，将 specifier check 提取到 `tools/governance/lib/` 的纯函数，纯函数与 audit CLI 同时使用。
- 在 `tools/governance/README.md` 或治理标准的既有规则位置补一条中英双语说明：Application/Domain consume Port only; Prisma concrete code belongs to Infrastructure。不得复制一套平行配置。

**测试与门禁**

- `pnpm nx run memoflow:governance-check --skip-nx-cache` 必须通过；该 target 会执行 package-internal boundary、package export、surface、scope、runtime dependency 等全套审计。
- Inventory：
  - `rg -n "from ['\"]@memoflow/database['\"]|import\\(['\"]@memoflow/database" packages/*/src/server/application packages/*/src/server/domain --glob '!**/*.spec.ts' --glob '!**/*.test.ts' --glob '!**/__tests__/**'` 必须返回空。
  - `rg -n "@memoflow/database" packages/*/src/server/infrastructure apps/api/src/runtime` 只允许 infrastructure/runtime 生产实现。
- 直接运行 governance unit tests（若新增 fixture），再运行 API/Goal/Data Portability 最近的 typecheck/lint；不得以 Nx package test 替代 direct Vitest。

**Step 4 完成条件**：规则在干净 inventory 上首次通过；后续任何 Application/Domain 生产 DB import 都能在单次 `governance-check` 中 fail closed，并且没有旧路径 allowlist。

## 5. 验证与门禁总表

### 5.1 每步门禁

| 阶段   | Unit / mapper                                                  | Integration / surface                                       | 静态 inventory                                                                   | 必过 target                                           |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Step 1 | relation/wallet use-case + mapper direct Vitest                | Prisma repository integration、Goal module/composer surface | Goal application/domain 无 DB import；Port method diff 与契约冻结一致            | `goal:typecheck`、`goal:lint`                         |
| Step 2 | import store transaction fake、portable use-case direct Vitest | DP PowerSync round-trip、compose-data-portability surface   | DP Prisma classes 只在 infrastructure；Application barrel 无 concrete export     | `data-portability:typecheck`、`data-portability:lint` |
| Step 3 | executor direct Vitest、composer direct Vitest                 | API smoke、module registration/destroy、AI config branches  | executor 无 DB/module factory/deep import；Application Port object identity 一致 | `api:typecheck`、`api:lint`                           |
| Step 4 | governance fixture direct Vitest                               | 全 governance audit                                         | Application/Domain DB inventory 为空；无 allowlist                               | `memoflow:governance-check --skip-nx-cache`           |

### 5.2 最终阶段门禁

- [ ] `pnpm nx run memoflow:docs-check --skip-nx-cache` 通过；计划 frontmatter、Markdown links、标题/编码与仓库 docs config 一致。
- [ ] `pnpm nx run memoflow:governance-check --skip-nx-cache` 通过；没有为本阶段新增生产 allowlist 或 baseline exception。
- [ ] Goal/DP/API direct Vitest 集合、typecheck、lint、API smoke 全部通过；不得运行已知会 hang 的 `pnpm nx run <pkg>:test`。
- [ ] `rg` inventory 与 package export/surface audit 证明：所有新增 public Port/composed interface 都有中英双语 JSDoc，所有 concrete Prisma class 留在 Infrastructure。
- [ ] Bootstrap smoke 对比：Goal/Task/Reminder/AI 注册顺序、路由 mounts、destroy reverse order、AI service config-null/unavailable 分支均与 baseline 相同。
- [ ] 变更 diff 只包含四个步骤所列的 production/test/governance 文件；本计划之外的 ExecutionContext、Query Cache、Transport parity 和 action loop 变更视为 gate failure。

## 6. 风险与回滚

| 风险                                          | 触发点                                                                                                                                   | 预防 / 证据                                                                                                                                                                             | 回滚动作                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Goal transaction / Decimal / error-code 漂移  | Wallet repository 拆出 `$transaction` 或 mapper 后把 Decimal 转成 number；Relation unique error 不再映射 `CONFLICT`；identity scope 丢失 | 先冻结 3.1–3.2；mapper unit + Prisma integration；对比 `ACCOUNT_NOT_FOUND → NOT_FOUND`、`Unique → CONFLICT`、Date ms 与 string Decimal fixtures                                         | 回滚 Step 1 commit；恢复 adapter 文件位置即可，不改 schema/数据；若仅 mapper 失败，保留 Port move 并回退 mapper implementation |
| Goal module wiring 产生重复 instance/listener | composer 为 AI 或 manifest 另建 Goal module，或把 runtime contribution 注册两次                                                          | 只从 `composeGoal` 输出 `applicationPort`；AI 不调用 module factory；composer spec 断言同一 `instance.api` identity 与一次 `createGoalModule`                                           | 先恢复 `composeGoal`/`main.ts` wiring，再保留 infrastructure Port move；禁止引入 singleton accessor 作为临时修复               |
| Data Portability import/export 行为变化       | import store 脱离 callback transaction；read adapter filters/row shape 被重写；Application barrel path 误导调用方                        | 只移动文件；round-trip、dry-run rejection、fake `$transaction` 与 compose wiring tests；保留旧 class names                                                                              | 反向移动两个实现文件并恢复 relative imports；不回退 Port/use-case contracts 或 PowerSync 实现                                  |
| AI action ordering / receipts / events 变化   | executor constructor refactor 顺带拆 loop、错误分支或重新创建 feature module；Application Port 不是同一 instance                         | 先冻结 loop；`backend-automation-tool-executor.adapter.test.ts` 锁 action sequence、skip/fail receipt、reviewed fields；compose tests 锁 object identity；API smoke 锁 module lifecycle | 回滚 Step 3 wiring；保留 Goal/DP layering fixes；不得通过重新在 executor 中创建 Prisma module 规避测试失败                     |
| Governance false positive                     | audit 把 test fixture、Infrastructure 或 generated code 当作 Application violation；动态 import pattern 漏报/误报                        | exact specifier rule；复用现有 test exclusion；加 positive/negative fixture；先跑 inventory 再启用无 allowlist规则                                                                      | 回滚 Step 4 audit change，修正纯函数/fixture 后重新启用；不添加长期路径 allowlist 来压过真实反转                               |
| Public surface / JSDoc 违规                   | 新 domain Port 或 composed interface 未有双语 JSDoc；concrete adapter 被 root/API barrel 导出                                            | surface spec、package-export audit、双语 JSDoc checklist                                                                                                                                | 删除多余 export，保留 package-internal import；不扩大 package subpath                                                          |

## 7. 完成定义

- [ ] 四个 Steps 均以独立 PR-able diff 完成，且每一步在合并前有自己的 direct Vitest/typecheck/lint/surface 证据。
- [ ] Goal Application/Domain 不 import `@memoflow/database`；Data Portability Application 不包含 Prisma implementation；AI executor 不包含 Prisma/module construction。
- [ ] `IRelationRepository`、`IWalletRepository`、`DataPortabilityImportStore`、Goal/Task/Reminder/AI Application Port 的冻结 shape 与错误、事务、Decimal、receipt/event 语义保持不变。
- [ ] `pnpm nx run memoflow:docs-check --skip-nx-cache` 与 `pnpm nx run memoflow:governance-check --skip-nx-cache` 均通过。
- [ ] 本阶段不宣称阶段 2（Request/Execution Context）、阶段 4（Transport parity）、阶段 5（Query Cache）或阶段 6（长期可观测性）完成。
