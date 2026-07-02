---
tags:
  - plan
  - active
  - ai
  - agent
  - checkpoint
  - remediation
description: AI Agent 剩余错误收口计划，聚焦 ts checkpoint 启动失败、checkpoint route 契约缺口、durable resume 语义和测试缺口
created: 2026-06-13T00:00:00
updated: 2026-06-13T00:00:00
---

# AI Agent 剩余错误收口计划

## 1. 总结

当前 AI Agent 主流程可用，但仍不能认定为“已完整优雅实现”。

本计划只覆盖已确认仍然存在的剩余错误，不重复记录已经关闭的问题。当前需要收口的缺陷主要集中在 checkpoint 正式链路和相关契约边界：

- `AGENT_CHECKPOINT_STRATEGY=ts` 在真实 app lifespan 下仍然启动失败。
- checkpoint HTTP route 仍未完整透传 `events` / `interrupts`。
- 当前持久化能力仍然只是“保存 projected run state”，不等同于“可跨进程恢复 LangGraph interrupt/resume”。
- 上述边界缺少针对性测试，导致错误被 completion 文档误判为已完成。

## 2. 已确认剩余问题

### 2.1 `ts` checkpoint 策略启动失败

现状：

- `apps/ai-service/src/ai_service/app.py` 已改为调用 `build_checkpointer` / `build_run_history_store`。
- 但 `lifespan` 中仍以 `identity_id=None` 构造 runtime。
- `build_run_history_store(...)` 在 `ts` 策略下明确要求真实 `identity_id`，否则直接抛 `ValueError`。

结果：

- `create_app()` 本身可以成功返回。
- 但只要真实进入 FastAPI lifespan，`AGENT_CHECKPOINT_STRATEGY=ts` 就会在启动阶段失败。

这说明：

- 当前并不存在“按请求惰性构造 identity-aware run history store”的真实实现。
- 相关 completion 文档的“多实例部署已就绪”结论不成立。

### 2.2 checkpoint route 仍然丢失 `events` / `interrupts`

现状：

- Python `TSCheckpointClient` 已发送 `events` / `interrupts`。
- TS `IAgentCheckpointPort` 已声明 `events` / `interrupts`。
- Prisma adapter 也已支持保存 `events` / `interrupts`。
- 但 `packages/ai/src/api/routes/ai-agent-checkpoint.routes.ts` 的 body schema 和 controller 调用仍然只接 `run`、`state`、`threadId`。

结果：

- 数据库层能力已补齐，但 HTTP 边界仍然截断数据。
- 当前修复不是端到端闭合。

### 2.3 durable resume 语义仍不成立

现状：

- `ts` 策略下 LangGraph checkpointer 仍是 `InMemorySaver`。
- runtime 在 `get_snapshot()` 时可以从持久化 run result 回退读取 projected state。
- 但 `resume` 仍直接依赖当前 graph 的中断态和 thread 对应的内存 checkpoint。

结果：

- 当前持久化更接近“run snapshot persistence”，不是“persistent LangGraph checkpoint”。
- 如果服务重启后只剩 TS checkpoint 记录，没有对应内存 graph state，则 `resume` 语义并未真正完成。

这意味着当前应明确区分两件事：

- 可以恢复查看 run snapshot。
- 不能承诺跨进程恢复所有 interrupt/resume 执行态。

### 2.4 测试护栏仍然不足

现状：

- 现有 `apps/ai-service/tests/test_agent_runtime_routes.py` 和 `tests/unit/test_agent_runtime.py` 能证明主流程大体可用。
- 但尚未形成对以下边界的稳定回归保护：
  - `ts` 策略真实进入 lifespan 的启动行为
  - checkpoint route 对 `events` / `interrupts` 的端到端透传
  - `ts` 策略下 identity-aware runtime 构造
  - 内存 graph state 缺失时的 `resume` 行为

结果：

- 文档和实现再次发生偏离的风险很高。

## 3. 修复目标

本轮目标不是引入新的大架构，而是把当前剩余错误收口到“行为真实、边界清晰、测试可守住”的状态。

完成后应达到：

1. `AGENT_CHECKPOINT_STRATEGY=ts` 在真实 lifespan 下可正常启动。
2. checkpoint route 能完整接收并持久化 `events` / `interrupts`。
3. 对“可恢复 snapshot”和“可恢复 LangGraph execution state”做明确边界定义。
4. 若 runtime 无法跨进程 resume，则返回稳定明确的错误，不伪装成已支持。
5. 相关文档和 completion 报告与代码实际能力保持一致。

## 4. 实施方案

### 4.1 重构 `ts` 策略下的 runtime 构造方式

不要继续在 app startup 阶段用 `identity_id=None` 构造 `ts` run history store。

建议收口方式：

- `local` 策略：
  - 保持当前 app-scoped singleton runtime。
  - 继续使用 file-backed local checkpoint / run history。

- `ts` 策略：
  - runtime 改为按请求、按 identity 构造。
  - 共享 app state 中的长生命周期 service，例如：
    - `goal_planning_service`
    - `knowledge_note_service`
    - `knowledge_query_service`
    - shared `InMemorySaver` / 其他需要跨请求共享的轻量对象
  - `get_goal_create_agent_runtime` / `get_knowledge_qa_agent_runtime` / `get_knowledge_generate_agent_runtime` 负责基于 `X-Identity-Id` 返回 identity-aware runtime。

约束：

- 不要把 identity-aware 行为仅写在注释里。
- 不要在 `ts` 模式下复用带错误 identity 或空 identity 的 runtime 单例。

### 4.2 补齐 checkpoint route 契约

需要同步修改：

- `packages/ai/src/api/routes/ai-agent-checkpoint.routes.ts`
- `packages/ai/src/controllers/ai-agent-checkpoint.controller.ts` 调用输入

要求：

- `POST /internal/agents/checkpoints` body schema 明确接受：
  - `events`
  - `interrupts`
- route handler 将这两个字段透传给 controller / port。
- 与现有 `AgentRunResult` / `AgentEvent` contract 对齐，不新增临时 shape。

### 4.3 明确 durable resume 的真实语义

当前不应继续对外宣称：

- “ts checkpoint 已支持多实例 durable resume”
- “跨服务重启后可继续 LangGraph interrupt/resume”

在没有真实 persistent LangGraph checkpoint 之前，应采用更诚实的行为：

- `get run` / `list runs` / `get events` 可以读取持久化 snapshot。
- `resume run` 若缺失对应的 graph memory checkpoint，则返回稳定错误。

推荐错误语义：

- HTTP `409 Conflict`
- 稳定错误码，例如：`runtime_checkpoint_missing`
- 错误信息明确说明：
  - 当前仅恢复了 run snapshot
  - 原始 LangGraph execution checkpoint 不存在
  - 该 run 不能继续 resume，只能查看或重新发起

### 4.4 回收错误文档结论

需要同步修正文档，避免仓库继续存在错误真值：

- `docs/plan/active/2026-06-13-checkpoint-refinement-completion.md`
- `docs/architecture/ai-agent-checkpoint-persistence.md`

需要修正的表述包括：

- 删除或降级“多实例部署已就绪”“100% 完成”“durable resume 已完成”等结论。
- 明确当前 `ts` 策略的实际状态：
  - snapshot persistence 有部分实现
  - 完整 durable LangGraph resume 尚未完成

## 5. 验证计划

### Python

- 新增 `ts` 策略 lifespan 启动测试：
  - 设置 `AGENT_CHECKPOINT_STRATEGY=ts`
  - 真实进入 `TestClient(app)` lifespan
  - 确认不因 `identity_id=None` 启动失败

- 新增 `resume` 缺失 graph checkpoint 的测试：
  - 仅保留 TS persisted snapshot
  - 清空或重建 runtime 内存 graph state
  - 调用 `resume`
  - 断言返回稳定的 `409 runtime_checkpoint_missing`

- 新增 `ts` 模式 identity-aware runtime 测试：
  - 两个不同 identity 调用同类 runtime
  - 确认使用各自 identity 的 checkpoint port

### TypeScript

- 新增 checkpoint route 测试：
  - `POST /internal/agents/checkpoints`
  - 覆盖 `events` / `interrupts` 被正确透传到 controller

- 新增 Prisma adapter 测试：
  - `events` / `interrupts` 写入数据库
  - 读取 checkpoint 时完整返回

### 回归

- 继续保持现有主流程绿灯：
  - `apps/ai-service/tests/unit/test_agent_runtime.py`
  - `apps/ai-service/tests/test_agent_runtime_routes.py`
  - 现有前端 AI workspace 核心 spec

## 6. 完成定义

本计划完成时，应满足以下条件：

- `AGENT_CHECKPOINT_STRATEGY=ts` 在真实 lifespan 中可启动。
- checkpoint route 不再丢失 `events` / `interrupts`。
- `resume` 在“只有 persisted snapshot、没有 graph checkpoint”时返回稳定明确错误。
- completion / architecture 文档不再夸大当前能力。
- 新增测试能稳定覆盖上述边界。

## 7. 明确不做

本轮不做：

- 不在本计划内引入真正的数据库版 LangGraph saver。
- 不在本计划内完成 PowerSync checkpoint adapter。
- 不把现有所有 agent runtime 全部改造成新的抽象层级，只做最小必要收口。

## 8. 优先级

1. `ts` 策略启动问题
2. checkpoint route 契约透传
3. durable resume 错误语义收口
4. 文档回收
5. 测试补齐

## 9. 结论

当前 AI Agent 系统的主用户流已经基本可用，但 checkpoint 正式链路仍有关键真值偏差。

这份计划的目标不是继续“宣告完成”，而是把剩余错误收口成一个真实、可验证、不会误导后续实现者的状态。
