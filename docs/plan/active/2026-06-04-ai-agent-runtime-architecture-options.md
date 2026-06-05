---
tags:
  - plan
  - active
  - ai
  - agent
  - runtime
description: AI Agent 系统搭建方案，定义 AgentRun、AgentState、ToolRegistry、事件流、checkpoint 与前后端边界
created: 2026-06-04T00:00:00
updated: 2026-06-04T00:00:00
---

# AI Agent 系统搭建方案

## 1. 目标

把当前 `ai-service` 的简易 workflow dispatch 升级为统一 Agent runtime。

这个 runtime 不追求“完全自主的多 agent 系统”，而是服务三个明确场景：

- Goal Agent：从自然语言创建目标、KR、任务节奏和复盘计划。
- Knowledge Generation Agent：从材料、对话、问答沉淀知识笔记。
- Knowledge Q&A Agent：基于个人知识库回答，并展示引用来源。

核心目标：

- 所有 agent run 都可追踪。
- 所有 workflow 都有明确状态。
- 需要用户确认时可以暂停并恢复。
- 前端可以展示节点进度、草稿、引用、待确认动作和执行结果。
- 业务写入仍经过受控 executor，不由模型直接操作数据库。

## 2. 运行时对象

### 2.1 AgentRun

一次 Agent 执行实例。

建议字段：

- `run_id`：唯一执行 ID。
- `thread_id`：checkpoint/resume cursor。
- `conversation_id`：关联 AI conversation。
- `identity_id`：用户身份。
- `agent_type`：`goal.create`、`knowledge.generate`、`knowledge.qa`。
- `status`：`running`、`interrupted`、`completed`、`failed`、`cancelled`。
- `created_at` / `updated_at`。

用途：

- 前端恢复当前工作流。
- 日志、成本、评估和失败恢复。
- 后续支持 run history。

### 2.2 AgentState

所有 graph 共享的基础状态。

建议字段：

- `messages`：用户和 assistant 的上下文。
- `intent`：解析后的用户意图。
- `stage`：当前 workflow 阶段。
- `artifacts`：结构化产物，例如 goal draft、knowledge answer、note draft。
- `citations`：知识引用来源。
- `retrieved_context`：只读工具返回的上下文。
- `pending_actions`：待确认写入动作。
- `approved_actions`：用户确认后的动作。
- `executed_actions`：执行结果。
- `usage`：token usage 和成本估计。
- `errors`：节点错误和恢复建议。

规则：

- `AgentState` 是 agent runtime 的真值。
- 现有 response DTO 是 HTTP 边界返回，不直接替代内部 state。
- 每个节点只更新自己负责的 state slice。

### 2.3 AgentGraphRegistry

按 agent type 注册 graph。

第一阶段注册：

- `goal.create`
- `knowledge.generate`
- `knowledge.qa`

后续可扩展：

- `day.plan`
- `goal.review`
- `repository.organize`
- `analytics.ask`

### 2.4 AgentToolRegistry

统一管理工具定义。

工具类型：

- read-only tool：可自动执行。
- side-effect tool：必须进入 pending action，由用户确认。

第一阶段 read-only tools：

- `search_knowledge`
- `fetch_resource`
- `fetch_goal_stats`
- `search_existing_goals`
- `find_related_notes`

第一阶段 side-effect tools：

- `create_goal`
- `create_key_result`
- `create_task_template`
- `create_reminder`
- `create_knowledge_note`
- `update_knowledge_note`
- `reindex_resource`

规则：

- side-effect tool 不直接暴露给 LLM 自动执行。
- LLM 可以生成 action plan。
- executor 只能执行用户确认后的 action。

## 3. 运行时接口

### 3.1 内部 Python 接口

推荐新增应用层概念：

```python
class AgentRuntime:
    async def start(self, request: AgentRunRequest) -> AgentRunResult: ...
    async def resume(self, request: AgentResumeRequest) -> AgentRunResult: ...
    async def stream(self, request: AgentRunRequest) -> AsyncIterator[AgentEvent]: ...
```

`AgentRunRequest`：

- `agent_type`
- `identity_id`
- `conversation_id`
- `input`
- `provider_config`
- `thread_id?`

`AgentResumeRequest`：

- `run_id`
- `thread_id`
- `resume_payload`
- `approved_actions?`
- `edited_artifacts?`

### 3.2 HTTP 边界

保留现有：

- `/internal/workflows/goal`
- `/internal/workflows/goal-automation`
- `/internal/workflows/knowledge`
- `/internal/workflows/knowledge-note`
- `/internal/workflows/knowledge-expand`
- `/internal/workflows/knowledge-index`

新增内部语义可以先不公开给前端，而是在这些 route 内部委托给 `AgentRuntime`。

成熟后再考虑：

- `POST /internal/agents/runs`
- `POST /internal/agents/runs/{run_id}/resume`
- `GET /internal/agents/runs/{run_id}/events`

原则：

- TS AI module 仍是前端唯一调用入口。
- 前端不直接绑定 LangGraph 或 Python 运行时细节。

### 3.3 Event Contract

前端需要统一事件流，而不是靠每个 workflow 自己拼 loading 文案。

建议事件：

- `run.started`
- `node.started`
- `node.completed`
- `message.delta`
- `artifact.updated`
- `citation.selected`
- `tool.started`
- `tool.completed`
- `approval.required`
- `action.executed`
- `run.completed`
- `run.failed`

事件字段：

- `run_id`
- `thread_id`
- `agent_type`
- `stage`
- `event_type`
- `payload`
- `created_at`

## 4. Checkpoint 与恢复

推荐分阶段实现：

### Phase 1：内存 checkpoint

用途：

- spike LangGraph。
- 开发验证 interrupt/resume。
- 不承诺刷新后恢复。

### Phase 2：持久 checkpoint

用途：

- Goal Agent 确认后恢复。
- Knowledge note 草稿刷新恢复。
- partial failure 后重试。

存储建议：

- 短期可存在 AI module execution log / run state 表中。
- 长期可接 LangGraph checkpointer 的 Postgres/Redis 方案，或者封装项目自己的 checkpoint port。

持久化内容：

- `AgentRun` metadata。
- `AgentState` snapshot。
- `pending interrupt payload`。
- `approved actions`。
- `execution result`。

## 5. 与现有系统的分工

Python `ai-service`：

- provider 调用。
- agent graph。
- structured output。
- read-only retrieval/rerank。
- action plan 生成。

TS `packages/ai` application layer：

- provider config resolution。
- identity context。
- knowledge index repository。
- business module port。
- execution log。
- API/IPC/HTTP adapters。

业务模块：

- Goal、Task、Repository、Reminder 继续负责最终写入。
- 不让 Python service 直接绕过业务模块写库。

前端：

- 只展示 Agent workspace、event、artifact、citation、approval panel。
- 不持有业务写入逻辑。

## 6. 推荐落地顺序

1. 增加 `AgentRunState` 和 `AgentEvent` 文档/类型草案。
2. 在 Python `ai-service` 内做 LangGraph spike，不接前端。
3. 用 Goal Agent 实现 `approval_interrupt`。
4. 让现有 `/internal/workflows/goal` 内部委托新 graph，但 response contract 保持兼容。
5. 给 Knowledge Q&A 加 `artifact.updated` 和 `citation.selected` 事件。
6. 前端工作台接入统一 agent event projection。
7. 持久化 checkpoint，并支持刷新恢复。

## 7. 风险

- 如果过早暴露通用 agent API，前端会被运行时细节污染。
- 如果把 side-effect tool 放进模型自动工具循环，会破坏确认边界。
- 如果 state schema 太泛，会变成不可测试的 JSON dump。
- 如果不保留现有 workflow response，迁移会影响 TS AI module 和前端。

## 8. 验收标准

- 每个 agent run 有稳定 `run_id` 和 `thread_id`。
- Goal Agent 可在确认节点暂停，并用同一 thread 恢复执行。
- Knowledge Q&A 可在事件中输出 citations。
- side-effect actions 只能从 `pending_actions -> approved_actions -> executed_actions` 流转。
- 现有 workflow route 在迁移期间保持可用。
