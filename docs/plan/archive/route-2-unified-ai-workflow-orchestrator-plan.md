---
tags:
  - guide
  - ai
  - plan
  - architecture
  - goal
description: Route 2 技术方案，规划 Unified AI Workflow Orchestrator、Execution Engine、CLI 与 provider-native function calling runtime
created: 2026-04-19T00:00:00
updated: 2026-04-19T00:00:00
---

> Superseded by `docs/plan/archive/2026-04-29-ai-goal-agent-workflow-unification.md`. 本文仅保留为 2026-04-19 阶段方案参考。

# Route 2：Unified AI Workflow Orchestrator 方案

这篇文档是后续 AI 工作流统一重构的主技术方案。

它建立在一个明确判断之上：

- 当前主产品流已经是 `AI Chat -> Goal Tool`
- 旧 automation 更适合作为保留中的执行能力层
- 后续不应继续维护两套并列产品入口

所以，Route 2 的目标不是“修补旧 automation 面板”，而是：

**把 Chat Goal Tool 升级为当前唯一 Goal 产品主线，并以 Unified AI Workflow Orchestrator + provider-native function calling runtime 作为统一内核。**

## 设计目标

Route 2 要同时解决 6 个问题：

1. 产品层当前只保留一条 Goal 创建主线
2. planning / confirm / execute 的工程化能力得到保留
3. Chat 与 CLI 共用同一套 orchestration 内核
4. side-effect tools 不会未经批准直接落库
5. provider 层从“文本 completions”升级到真正的 function calling runtime
6. 顶层架构能够自然扩展到 knowledge note、query、analytics 等 workflow

## 最终用户工作流

最终收敛到这一条：

`chat context -> clarification -> draft -> review/edit -> plan -> confirm -> execute -> timeline/result`

这个工作流里：

- `clarification` 负责补齐信息缺口
- `draft` 负责结构化草稿与人工编辑
- `plan` 负责显式副作用、理由和上下文
- `confirm` 负责审批闸门
- `execute` 负责真实业务写入
- `timeline/result` 负责可观测、失败恢复与结果回显

## 架构收敛原则

## 1. 产品层：单一主入口

唯一主入口应该是：

- `AIChatView.vue` 中的 `goal` workflow

旧 `AIWorkspaceToolbox` 不再被视为默认产品承载面。

它可以：

- 保留作冻结实现参考
- 或未来降级为 developer/debug UI

但不再作为未来主产品流的定锚点。

## 2. 实现层：保留 automation 资产

要保留并复用的资产包括：

- `plan / confirm / execute` 分层
- `approvedPlan + approvedActions` 复用
- side-effect tool confirmation
- execution log
- executedActions
- tool executor 边界

## 3. 领域层：业务写入永远走应用门面

所有 side-effect tool 必须通过现有应用层门面执行：

- Goal / Key Result：`goal` 模块
- Task Template：`task` 模块
- Knowledge Note：`repository` 模块

不允许模型直接写仓储或数据库。

## 目标架构

推荐收敛成下面这组模块：

### 1. `AIWorkflowOrchestrator`

这是新的顶层统一编排核心，负责：

- 根据 tool mode / request type 路由到具体 workflow
- workflow stage 判断
- 统一 request id、trace、timeout、max turns
- 调用 provider runtime
- 接住 tool calls
- 输出前端或 CLI 需要的统一结果结构

它不直接承载 Goal 细节，而是协调具体 workflow handler。

### 2. `Workflow Handlers`

每类 AI workflow 应由独立 handler 承载领域阶段和策略。

第一批应至少包括：

- `GoalWorkflowHandler`
- `KnowledgeNoteWorkflowHandler`
- `KnowledgeQueryWorkflowHandler`
- `AnalyticsWorkflowHandler`

其中当前第一落点是 `GoalWorkflowHandler`，负责：

- clarification / draft / review / plan / confirm / execute 阶段建模
- Goal draft 与 execution plan 的 DTO 映射
- side-effect action proposal 生成
- 与 Goal workflow UI 状态对齐

### 3. `ToolRegistry`

提供所有 Agent 可用工具的统一注册表。

至少应支持：

- `search_notes`
- `fetch_stats`
- `query_knowledge`
- `query_analytics`
- `create_goal`
- `create_key_result`
- `create_task_template`
- `create_knowledge_note`

每个工具都应声明：

- 输入 schema
- 输出 schema
- 是否 read-only
- 是否 side-effect
- 是否需要用户确认
- 幂等策略

### 4. `ExecutionEngine`

负责执行已批准的 tool calls。

这层应该是对当前 `BackendAutomationToolExecutorAdapter` 的演进，而不是另起一套逻辑。

它负责：

- 顺序执行或受控并发
- action result 聚合
- partial success
- retry metadata
- timeline record

### 5. `Provider-Native Function Calling Runtime`

负责模型和工具之间的真正多轮循环。

这层要支持：

- tool schema 注入
- provider 返回 tool calls
- tool result 注入下一轮消息
- 最大轮次控制
- 流式与非流式兼容

### 6. `CLI Entry`

CLI 不是独立逻辑，而是统一 orchestrator 的另一个入口。

至少支持：

- `plan`
- `dry-run`
- `execute-approved-plan`
- `replay`

## 工具分层策略

Route 2 中，工具不应该一刀切。

## A. Read-only tools

这类工具可以在 chat 中自动执行：

- `search_notes`
- `fetch_stats`
- `query_knowledge`
- `query_analytics`

它们的作用是：

- 补上下文
- 减少 hallucination
- 让 draft / plan 更 grounded

## B. Side-effect tools

这类工具默认不能自动执行：

- `create_goal`
- `create_key_result`
- `create_task_template`
- `create_knowledge_note`

它们必须先进入 proposal / plan 阶段，再由用户确认。

这意味着：

- 模型可以提议
- workflow handler / orchestrator 可以整理 proposal
- ExecutionEngine 只执行 approved actions

## 为什么要走 provider-native function calling

当前 `ai-service` 的 provider 层，本质上还是 `/chat/completions` 文本模式：

- `complete()` 读取 `message.content`
- `stream()` 读取 `delta.content`

这意味着当前更像：

- 模型返回结构化 JSON
- 应用自己把 JSON 当成“手工 toolCalls”

这能工作，但它不是完整的 agent runtime。

Route 2 之所以要升级，是因为真正的 function calling runtime 能带来：

- 更标准的 tool negotiation
- 更清晰的 tool result turn
- 更自然的多轮工具循环
- 更容易扩展为真正的 chat agent

## 但为什么还要保留“确认后执行”机制

因为 provider-native function calling 不等于要放弃安全边界。

Route 2 的原则是：

- read-only tools：可自动执行
- side-effect tools：模型只能提议，不能直接落库

这也是为什么 `approvedPlan + approvedActions` 的思想必须保留。

## Chat 与 CLI 的关系

Route 2 里，Chat 和 CLI 的关系应该是：

- Chat：产品入口
- CLI：开发者入口 / 调试入口 / 回归入口

它们共用：

- AI workflow orchestrator
- tool registry
- execution engine

但输出形态不同：

- Chat 输出 workflow UI 状态
- CLI 输出文本、JSON 或 dry-run result

## 推荐阶段划分

## 第一阶段：统一主线

先完成：

- Chat Goal Tool 成为唯一主线
- clarification / draft / plan / confirm / execute 状态设计
- future execution plan UI 占位与契约

## 第二阶段：抽出统一执行层

完成：

- AIWorkflowOrchestrator
- GoalWorkflowHandler
- ToolRegistry
- ExecutionEngine

这时即使 provider 还没升级，仍可先用结构化 `toolCalls` 跑通统一流程。

## 第三阶段：升级 provider-native function calling

完成：

- provider adapter tool calling 支持
- tool loop runtime
- tool result message 机制

这时 chat 内的 Goal workflow 才真正从“结构化规划器”升级成“function-calling workflow”。

## 第四阶段：补 CLI、评测与演示

完成：

- CLI
- regression cases
- live eval
- demo panel

## 技术决策摘要

Route 2 的关键决策可以压成这几条：

1. 产品层只保留 `Chat Goal Tool` 主入口
2. automation 降级为实现层资产，而不是产品层入口
3. side-effect tool 一律走审批闸门
4. Chat 与 CLI 共用统一 orchestrator
5. 最终升级到 provider-native function calling runtime，而不是长期停留在手工 JSON `toolCalls`
6. Goal 只是第一优先 workflow，不是永久顶层命名

## 一句话记忆版

Route 2 的本质不是“复活 automation”，而是：**以 Chat Goal Tool 为当前唯一主产品流，把旧 automation 的规划与执行能力抽成统一 AI workflow 内核，再升级到真正的 function calling agent runtime。**
