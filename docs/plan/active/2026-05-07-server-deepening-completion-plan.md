# 服务端 Deepening 完整优化执行方案

> 创建时间: 2026-05-07
> 状态: 进行中
> 范围: `ai`、`repository`、`goal` 三个后端模块的剩余 deepening 工作
> 诊断基线: [服务端 Deepening 实现诊断](./2026-05-07-server-deepening-implementation-diagnosis.md)
> 参考总览: [服务端 Deepening 执行总览](./2026-05-06-server-deepening-execution-overview.md)

## 目标

本轮不再重新审查，而是收尾现有 deepening：

1. 完成 `ai` 剩余 runtime-owned capability surface 收口
2. 完成 `repository` 剩余 mutation seam 类型与上传语义收口
3. 完成 `goal` 剩余 aggregate / clone DTO 泄漏回收
4. 同步 active 计划文档状态到真实代码进度

## 固定边界

本轮默认不做：

- 前端 workspace seam deepening
- 全仓 contracts sweep
- route path / controller public method 名称调整
- 新增 AI 第三种 runtime mode
- `schedule` 的新一轮结构重构

## 执行顺序

固定顺序如下：

1. `ai`
2. `repository`
3. `goal`
4. 文档状态同步与归档判断

原因：

- `ai` 是剩余结构阻塞项，且仍有 top-level capability branching
- `repository` 和 `goal` 主要是 seam 纯化，风险低于 `ai`
- 文档状态必须以最终代码和测试结果为准

## 模块收尾要求

### `ai`

- runtime 输出稳定且非空的 service surface
- top-level `createAIModule()` 不再维护 capability-specific null guard
- unavailable capability 统一由 runtime-owned service 返回 `SERVICE_UNAVAILABLE`
- `getCapabilities()` 与 runtime 实际 service 可用性保持一致

### `repository`

- `ResourceMutationService` mutation public surface 不再返回 `Result<unknown>`
- 单文件 upload 语义回收到 mutation seam：
  - folder / path resolution
  - mime / content normalization
  - replace / skip 规则
  - storage write / delete / event emission
- `UploadResourcesUseCase` 只保留批量遍历与成功失败汇总

### `goal`

- `GetGoalAggregateUseCase` 直接从 aggregate / records materialize 响应
- `CloneGoalUseCase` 直接从 aggregate 字段构造 canonical create payload
- 不再通过 `GoalClientDTO` 做 aggregate -> DTO -> use case 反推

## 验收标准

完成后必须同时满足：

- `packages/ai` 测试通过
- `packages/repository` 测试通过
- `packages/goal` 测试通过
- `packages/schedule` 回归测试通过
- `pnpm nx run daily-use:governance-check` 通过
- active 计划文档状态与实际代码进度一致

## 文档状态同步规则

- `2026-05-07-server-deepening-implementation-diagnosis.md` 保留为诊断基线
- `2026-05-06-ai-runtime-module-split.md`
- `2026-05-06-repository-resource-mutation-deepening.md`
- `2026-05-06-goal-read-model-workflow-deepening.md`

上述文档在本轮结束后必须至少同步状态，不再继续保留“待实施”与代码现状冲突的描述。

若三项模块全部完成且仅保留历史参考价值，应移入 `docs/plan/archive`。
