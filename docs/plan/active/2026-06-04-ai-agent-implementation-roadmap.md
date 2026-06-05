---
tags:
  - plan
  - active
  - ai
  - agent
  - roadmap
description: AI Agent 系统实施路线图，分阶段落地运行时、Goal Agent、Knowledge Q&A、Knowledge Generation 和验证体系
created: 2026-06-04T00:00:00
updated: 2026-06-04T00:00:00
---

# AI Agent 实施路线图

## 1. 总体策略

不要一次性重写 AI 模块。

推荐采用“兼容入口、内部替换、逐步上 graph”的方式：

- 前端产品形态先统一到 AI Agent Workspace。
- TS AI module 继续作为前端调用边界。
- Python `ai-service` 内部逐步引入 Agent runtime。
- 现有 workflow response contract 先保持兼容。
- Goal Agent 先验证 confirmation interrupt。
- Knowledge Q&A 再验证 citation artifact。
- Knowledge Generation 最后串起 write + index。

## 2. Phase 1：Agent Contract 与 UI Projection

目标：

- 不引入外部 runtime。
- 先统一 agent 概念、状态、事件和前端投影。

工作：

- 定义 `AgentRun`、`AgentState`、`AgentEvent` 文档和 TS/Python 类型草案。
- 前端 AI 工作台支持统一右侧 context panel。
- `WorkflowMode` 从技术模式转为用户意图：
  - `chat`
  - `goal-create`
  - `knowledge-qa`
  - `knowledge-generate`
- `AIChatService` 暴露现有 `queryKnowledge`。
- 保留现有 goal draft 和 knowledge note 能力。

验收：

- `/` 展示 AI Agent Workspace。
- 空会话可选择“创建目标”“问知识库”“整理知识”。
- 不改后端 runtime 也能展示统一意图入口。

## 3. Phase 2：LangGraph Spike

目标：

- 在 Python `ai-service` 内验证 graph、checkpoint、interrupt、event streaming。
- 不接真实业务写入。

工作：

- 新增实验性 `agent_runtime` package。
- 用 memory checkpointer 实现一个最小 Goal graph。
- 节点：
  - `intake`
  - `draft_goal`
  - `approval_interrupt`
  - `mock_execute`
  - `result`
- 输出 `AgentEvent`。
- 单测覆盖 interrupt/resume。

验收：

- graph 可暂停在 approval 节点。
- 使用同一 thread id 可 resume。
- mock action 不会在确认前执行。
- 单测可验证 state snapshot。

## 4. Phase 3：Goal Agent 接入真实 Workflow

目标：

- 把现有 goal draft 和 automation plan/execute 收敛到统一 Goal Agent。

工作：

- Graph node 调用现有 `GoalPlanningService`。
- `retrieve_context` 复用 knowledge source 和 analytics context。
- `plan_actions` 产出 pending actions。
- `approval_interrupt` 返回前端确认 payload。
- `execute_actions` 委托 TS controlled executor。
- 保持 `/internal/workflows/goal` 和现有 TS contract 兼容。

验收：

- 用户一句话生成目标草稿。
- 信息不足时追问。
- 右侧面板可编辑 goal/KR/task。
- 确认前不写业务对象。
- 确认后创建目标/KR/task template。
- 执行结果展示 timeline 和 recovery。

## 5. Phase 4：Knowledge Q&A 接入 Agent Artifact

目标：

- 让“问知识库”成为统一工作台里的第一类 Agent。

工作：

- 前端启用 `knowledge-qa` 意图。
- `AIChatService` 接入 `queryKnowledge`。
- 后端先复用 `QueryKnowledgeUseCase` 和 `KnowledgeQueryService`。
- 结果不只写入 message content，也保存 `KnowledgeAnswerArtifact`。
- 右侧展示 citation、related notes、index status。
- 证据不足时走专用 empty state。

验收：

- answer 有 citations。
- citation 可打开来源。
- citation 为空时展示证据不足。
- 用户可以点击“沉淀为知识笔记”进入 Phase 5 草稿流。

## 6. Phase 5：Knowledge Generation Agent

目标：

- 支持从材料、对话、问答结果创建知识笔记。

工作：

- 新增 Knowledge Generation graph。
- 复用 `KnowledgeNoteService` 生成 markdown。
- 增加 related notes 检索和 duplicate risk。
- 确认面板展示 title/path/tags/markdown/source。
- 确认后通过 Repository module 保存。
- 保存后触发 index note 或标记待索引。

验收：

- 从问答生成知识笔记草稿。
- 从当前对话生成知识笔记草稿。
- 确认前不写 repository。
- 写入后返回 resource path。
- 索引成功/失败状态可见。

## 7. Phase 6：Durability 与 Observability

目标：

- 让 agent run 可恢复、可调试、可评估。

工作：

- 引入持久 checkpoint。
- 保存 `AgentRun` metadata。
- 保存 pending interrupt。
- 执行日志记录 node timing、tool calls、token usage。
- goal 和 knowledge 增加 eval harness。
- 前端刷新后恢复 active run。

验收：

- 刷新后能恢复 Goal Agent 草稿/确认状态。
- 失败 action 可重试。
- 每次 run 可追踪 token usage 和节点耗时。
- eval 能捕获 goal draft 质量和 knowledge grounding 回归。

## 8. 代码验证建议

Python：

- `apps/ai-service/tests/unit/test_agent_runtime.py`
- `apps/ai-service/tests/unit/test_goal_agent_graph.py`
- `apps/ai-service/tests/unit/test_knowledge_qa_graph.py`
- `apps/ai-service/tests/unit/test_knowledge_generation_graph.py`

TS application layer：

- `packages/ai` query knowledge use case tests。
- goal prepare/execute contract tests。
- remote ai-service runtime capability tests。

Frontend：

- `AIChatView.spec.ts`
- knowledge citation panel tests。
- goal approval panel tests。

E2E：

- `/` loads agent workspace。
- create goal from natural language。
- ask personal knowledge base with citations。
- save Q&A as knowledge note。

## 9. 风险控制

- 每个 phase 必须保持现有主流程可用。
- 不在 Phase 2 直接改生产路由。
- 不把 LangGraph 类型泄漏到前端。
- 不让 side-effect tool 进入自动 LLM tool loop。
- 不在没有 citations 的情况下展示“知识库已回答”的确定语气。

## 10. 完成定义

第一阶段完成定义：

- 首页变成 AI Agent Workspace。
- Goal Agent 支持草稿、计划、确认、执行。
- Knowledge Q&A 支持引用答案。
- Knowledge Generation 支持问答/对话沉淀为笔记草稿。
- 所有写入动作都有确认面板。
- 文档、测试和 eval 能支撑后续继续扩展 agent runtime。
