# Goal Read-Model Workflow Deepening 执行方案

> 创建时间: 2026-05-06
> 状态: 进行中
> 来源: [服务端 Deepening 执行总览](./2026-05-06-server-deepening-execution-overview.md)
> 审查来源: [Codebase Architecture Deepening 审查与后续计划](./2026-05-06-codebase-architecture-deepening-audit.md)

## 问题定位

`goal` 当前的主要问题不在 composition root，而在 [goal.controller.ts](D:/home/projects/dailyuse/packages/goal/src/controllers/goal.controller.ts:202) 之后的 controller orchestration。

当前仍然由 controller 持有的 implementation 包括：

- `getAggregate`
- `getProgressBreakdown`
- `cloneGoal`
- `batchUpdateKeyResultWeights`

这些逻辑的问题是：

1. controller 不再是“验证 + 委派”的薄 adapter，而是在组装 read model 和 command workflow
2. progress 计算规则散落在 controller，不是 application seam
3. clone 的 payload materialization 藏在 controller helper
4. batch weight update 以控制器内循环的形式存在，没有独立测试面
5. route 层仍保留一部分 query alias normalization，controller 又继续做 query 组装，职责边界不清

## 目标结构

本轮固定新增 4 个 deep module。

### 1. `GetGoalAggregateUseCase`

建议位置：

- `packages/goal/src/application-server/use-cases/queries/get-goal-aggregate.use-case.ts`

职责：

- 直接从 repository 读取 aggregate（`includeChildren=true`）
- 读取 records
- materialize goal / keyResults / reviews / records
- 产出现有 `GetGoalAggregateRes`

必须保留的当前行为：

- 若 goal 不存在，错误直接透传
- records 读取失败时，不要伪装成成功
- response shape 对齐现有 aggregate route contract

固定实现要求：

- 不通过 `GetGoalUseCase` 再拿 DTO 回来二次加工
- 直接读取 domain aggregate，避免“aggregate → DTO → controller/use-case 再推导”的往返损耗
- 最终在 query use case 内统一完成 DTO materialization

### 2. `GetGoalProgressBreakdownUseCase`

建议位置：

- `packages/goal/src/application-server/use-cases/queries/get-goal-progress-breakdown.use-case.ts`

职责：

- 直接从 repository 读取 aggregate（`includeChildren=true`）
- 优先复用领域聚合现有的 `goal.getProgressBreakdown()`
- 统一 `lastUpdateTime` 与 `updateTrigger` 产出

固定计算策略：

- 不在 application layer 重新手写一份 progress 数学
- 以领域聚合 `Goal.getProgressBreakdown()` 的现有语义为唯一真值
- 若发现 controller 当前行为与聚合行为不一致，以聚合行为为准，并同步 route contract 测试基线

### 3. `CloneGoalUseCase`

建议位置：

- `packages/goal/src/application-server/use-cases/commands/clone-goal.use-case.ts`

职责：

- 读取原始 goal
- 根据 clone request 生成 create payload
- 调用 `CreateGoalUseCase`

必须保留的当前行为：

- `name` 默认 `${original.name} (Copy)`
- `description` 默认回退原 goal description
- 继承原 goal 的 `importance`、`category`、`tags`
- 最终仍走 `CreateGoalSchema.parse(...)` 的 canonical create payload 校验语义

### 4. `BatchUpdateKeyResultWeightsUseCase`

建议位置：

- `packages/goal/src/application-server/use-cases/commands/batch-update-key-result-weights.use-case.ts`

职责：

- 顺序执行多个 key result weight update
- 任何一步失败立即返回失败
- 全部成功后刷新并返回更新后的 goal

固定行为：

- 保持顺序执行，不并行
- 不在本轮引入 snapshot / transaction / rollback 语义
- 保持 route response shape 不变
- 不额外引入新的 weight snapshot 持久化流程

## Route / Controller 收口方案

### Controller 调整目标

`GoalController` 完成后应回归为：

- Zod 校验
- 轻量参数适配
- 对新 use case 的直接委派

controller 不再负责：

- aggregate materialization
- progress 数学计算
- clone payload construction
- batch command orchestration

### Route 层 alias 归一策略

`goal.routes.ts` 里当前保留了一部分 query alias 兼容。

本轮不删除兼容，但要把它们收口到一个小型 helper，例如：

- `normalizeGoalListQuery(...)`

职责：

- `includeChildren` / `includeKeyResults`
- `limit` / `pageSize`
- `dirId` / `folderId`
- 其他现有 route-level alias

固定规则：

- route 做 alias normalization
- controller 做 Zod validation
- use case 只接收 canonical query shape

不要把 alias 兼容继续散落在 route handler 内联代码和 controller 之间。

## 实施步骤

### Wave 1: 新增 workflow use case 与测试

新增：

- `GetGoalAggregateUseCase`
- `GetGoalProgressBreakdownUseCase`
- `CloneGoalUseCase`
- `BatchUpdateKeyResultWeightsUseCase`

同时新增独立 spec。

这一波先不删除 controller 逻辑，但新 use case 的行为必须和现有 controller 输出对齐。

### Wave 2: 切换 controller 到新 seam

调整 `GoalUseCases` 接口与 `GoalController`：

- `getAggregate()` 直接委派 `GetGoalAggregateUseCase`
- `getProgressBreakdown()` 直接委派 `GetGoalProgressBreakdownUseCase`
- `cloneGoal()` 直接委派 `CloneGoalUseCase`
- `batchUpdateKeyResultWeights()` 直接委派 `BatchUpdateKeyResultWeightsUseCase`

删除 controller 内部：

- `toCreateGoalReqFromCloneSource`
- progress calculation 实现
- aggregate materialization 实现
- batch update 循环

### Wave 3: 收口 route query normalization

在 route 层引入单一 normalization helper：

- 不改变 query contract
- 不改变 route path
- 只把现有 alias 逻辑集中

完成标准：

- route 里不再散落多个 parse helper 和 alias 分支
- controller 不再承担 query canonicalization

## Composition Root 调整

改造 [goal.module.ts](D:/home/projects/dailyuse/packages/goal/src/infrastructure-server/goal.module.ts:429)：

- `createGoalUseCases()` 增加 4 个新 use case
- `GoalModuleUseCases` 增加对应字段
- `createGoalModule()` 的 `api` 直接暴露这些 workflow seam

固定要求：

- 不删除现有底层 use case
- `GetGoalAggregateUseCase` 与 `GetGoalProgressBreakdownUseCase` 允许直接依赖 `IGoalRepository`
- `CloneGoalUseCase` 与 `BatchUpdateKeyResultWeightsUseCase` 复用现有 `CreateGoalUseCase`、`UpdateGoalKeyResultUseCase`
- 不在 composition root 内重新拼装 aggregate/progress/clone/batch workflow

## Public Seam 不可变项

本轮默认不修改：

- `GET /api/v1/goals/:id/aggregate`
- `GET /api/v1/goals/:id/progress-breakdown`
- `POST /api/v1/goals/:id/clone`
- `PUT /api/v1/goals/:id/key-results/batch-weight`
- 对应 response schema shape
- `GoalController` 对外方法名

允许变化：

- controller 内部依赖的 use case 结构
- module use cases 集合
- route 层内部 helper 拆分

## 测试要求

必须新增：

- `get-goal-aggregate.use-case.spec.ts`
- `get-goal-progress-breakdown.use-case.spec.ts`
- `clone-goal.use-case.spec.ts`
- `batch-update-key-result-weights.use-case.spec.ts`

必须保持通过：

- `packages/goal/src/api/routes/goal.routes.spec.ts`
- 现有 goal query / command use case spec

建议覆盖场景：

- aggregate 包含 goal、keyResults、records、reviews、statistics
- progress breakdown 与 `Goal.getProgressBreakdown()` 当前语义严格一致
- `totalWeight === 0` 时 fallback 逻辑保持与聚合实现一致
- clone 在只传空 body 时使用默认 copy 行为
- clone 在传入 name/description 覆盖时使用新值
- batch weight update 任一步失败时立即返回失败
- batch weight update 全部成功后返回刷新后的 goal

## 最小验证

实施后至少运行：

- `pnpm nx run goal:typecheck`
- `pnpm nx run goal:test`
- `pnpm nx run daily-use:governance-check`

## 完成定义

只有同时满足以下条件，才算此项完成：

1. `GoalController` 回到薄 adapter 角色
2. aggregate / progress / clone / batch weight 拥有独立 application seam
3. route alias 兼容集中到单一 normalization helper
4. route contract 继续稳定
5. 读模型规则不再分散在 route + controller 两层
