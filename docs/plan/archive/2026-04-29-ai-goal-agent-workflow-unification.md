---
tags:
  - plan
  - archive
  - ai
  - goal
  - workflow
description: AI goal 与 agent workflow 文档统一及后续实现主计划
created: 2026-04-29T00:00:00
updated: 2026-04-29T22:05:00
status: archived
---

> 归档说明：该统一方案涉及的主链路与后续 workflow 收口已落地，本文现仅保留为历史统一方案参考。

# AI Goal / Agent Workflow Unification

## Summary

这份计划是当前 AI goal / agent workflow 的唯一正式实施方案。

- 计划真值目录：`docs/plan/active`
- `docs/guides/ai` 仅保留索引、学习材料、冻结实现记录和工程参考
- 当前主产品流仍然是 `AI Chat -> goal -> draft -> edit -> create`
- `goal automation` 的价值保留在 `plan / confirm / execute` 能力层，而不是并列产品入口

## Progress Snapshot

- Phase 1 已完成：文档 canonical 入口已经统一到 `docs/plan/active`
- Phase 2 已完成第四段：请求侧已收敛为 `command: 'draft' | 'prepare' | 'execute'`，后端统一 workflow response 维持 `clarification | draft | confirm | result`
- Phase 3 已完成第一段：`AIChatView` 已支持澄清问题展示、回答提交，以及会话级状态持久化与恢复
- Phase 4 已完成第二段：`AIChatView` 已通过同一个 `generateGoal` 入口串起 `draft -> plan -> confirm -> execute -> result`
- Phase 4 已完成第三段：废弃的 `AIWorkspaceToolbox` / 弹窗入口与独立 `automateGoal` public surface 已删除，goal workflow 只保留聊天页主入口
- Phase 4 已完成第四段：`AIChatView` 已把 `plan / confirm / execute / result` 收敛成显式前端状态机，并纳入会话级恢复
- Phase 4 已完成第五段：统一 workflow 的 `result` 响应已补齐 `executionSummary + recovery`；聊天页已显式展示 execution timeline、partial success / failed action 状态，以及可重试恢复建议
- Phase 5 已完成第五段：`ai-service` 的 OpenAI-compatible provider 已支持 native tool call 返回，goal automation planning 已能通过 `submit_goal_automation_plan` 提交最终方案，并在内部提供 repository resources / analytics context 时自动执行 `search_notes` 与 `fetch_stats` 两类只读 tool；tool result 回合已收口为结构化 `assistant/tool` message，并已抽成可复用的 provider tool runtime，供后续 workflow handler 复用
- Phase 5 已完成第六段：`ai-service` orchestrator 已不再停留在单一 `goal` handler；`goal` handler 已复用统一 `GoalPlanningService` wiring，`analytics` handler 已接入统一 workflow orchestrator
- Phase 5 已完成第七段：`knowledge` handler 已接入统一 workflow orchestrator，`ai-service` 当前已真实承载 `goal / analytics / knowledge` 三条 workflow 链
- Phase 5 已完成第八段：`goal / analytics / knowledge` 三条 handler 驱动链路已统一收口到 `/internal/workflows/{type}`；旧的 `/internal/goals/plan`、`/internal/analytics/query`、`/internal/knowledge/query` 已删除，TS adapters 已切换到统一入口
- Phase 5 已完成第九段：剩余的 `goal-automation`、`knowledge-note`、`knowledge-index`、`knowledge-expand` 也已并入 `/internal/workflows/{type}`；`goals.py` 与 `knowledge.py` 平行 internal route 已删除，`ai-service` 内部 workflow transport 现已只保留统一入口

## Current State

当前代码和文档存在 4 个需要先校准的事实：

1. Python `ai-service` 已经具备 `AIWorkflowOrchestrator`、`GoalWorkflowHandler`、`AnalyticsWorkflowHandler`、`KnowledgeWorkflowHandler` 和 clarification 能力；OpenAI-compatible provider 也已能在 non-streaming completion 中返回 native tool calls，并在 goal automation planning 中执行 `search_notes`、`fetch_stats` 两类只读 tool。
2. TypeScript 主链路已经切到统一 `GenerateGoalsReq -> GoalWorkflowResultDTO` workflow contract；请求侧使用 `command: 'draft' | 'prepare' | 'execute'`，聊天页前端已显式维护 `plan / confirm / execute / result` 阶段，但后端 public response 已收敛为 `clarification | draft | confirm | result`，其中 `plan` 是前端本地阶段，`execute` 仍未单独抽成响应 state。执行结果侧当前已经补齐 `executionSummary + recovery`，用于表达 success / partial / failed 和失败动作的恢复建议。`ai-service` 内部 transport 也已统一为 `/internal/workflows/{type}`，不再保留平行 internal route。
3. `AIChatView` 是当前唯一真实主入口；旧 `AIWorkspaceToolbox` 与悬浮弹窗代码已移除。
4. `docs/guides/ai` 已经收敛为 canonical plan 导航页，但仍保留冻结记录和历史材料；后续判断一律以 `docs/plan/active` 与当前代码为准。

## Target Workflow

统一后的目标链路固定为：

`clarification -> draft -> review/edit -> plan -> confirm -> execute -> result`

其中：

- `clarification`：信息不足时返回 2-4 个澄清问题，而不是直接生成 draft
- `draft`：生成结构化 goal draft，允许人工编辑
- `plan`：显式展示将要执行的 side-effect actions 和理由
- `confirm`：用户审批已生成的 plan 与 actions
- `execute`：执行 approved actions，不重新规划
- `result`：展示 execution timeline、部分成功、失败原因与后续恢复信息

## Architecture Decisions

- `AIChatView` 保持唯一产品入口，不再发展两套并列 goal 产品流。
- 旧 `goal automation` public API 中的 `approvedPlan + approvedActions`、确认闸门和 executor 边界，已经被吸收到统一 workflow，不再保留独立 transport 入口。
- `apps/ai-service` 中的 orchestrator / handler 作为后端统一工作流内核继续演进。
- side-effect tools 只能被模型提议，不能自动落库；执行必须经过 confirm。
- Goal 是第一批 workflow handler，不作为永久顶层命名；后续可扩展到 knowledge、query、analytics。

## Implementation Phases

### Phase 1: Documentation Unification

- 把 AI 活跃计划统一收敛到 `docs/plan/active`
- 将过时方案迁入 `docs/plan/archive`
- 重写 `docs/guides/ai/README.md` 为统一导航页
- 给保留的工程参考文档补充 non-canonical 说明

### Phase 2: Contract Unification

- 用统一 workflow contract 取代当前单次 draft contract
- 请求侧需要支持：`idea`、`category`、`timeframe`、`providerId`、`model`、`clarificationAnswers`
- 响应侧需要引入统一 `state`
- `AIClientService`、controller、route、contracts 围绕 workflow response 建模

### Phase 3: Chat Goal Workflow State Machine

- 在 `AIChatView` 中接入 `clarification / draft / plan / confirm / result` 阶段
- 统一会话级工作流状态持久化和恢复
- 让 draft 编辑、plan 展示、confirm 和结果展示落在同一主链路

### Phase 4: Execution Capability Merge

- 将 `goal automation` 的 planning / confirm / execute 能力并入 chat goal workflow
- 保证 confirm 后只执行 approved plan/actions，不重新调用 planning
- 补 action timeline、partial success 和失败恢复

### Phase 5: Provider-Native Tool Calling

- 扩展 `ai-service` provider adapters，支持 provider-native tool calling
- 引入受控 tool loop
- read-only tools 可自动执行，side-effect tools 继续走 confirm gate

## Public Interfaces

后续实现默认按下面的接口方向推进：

- `GoalWorkflowRequest`
  - `idea: string`
  - `category?: string`
  - `timeframe?: string`
  - `providerId?: AiProviderConfigId`
  - `model?: string`
  - `command?: 'draft' | 'prepare' | 'execute'`
  - `clarificationAnswers?: string[]`
  - continuation 所需 workflow context
- `GoalWorkflowResponse`
  - `state: 'clarification' | 'draft' | 'confirm' | 'result'`
  - 按 state 暴露对应 payload，而不是始终只返回 draft

## Test Plan

- 文档治理：
  - `docs/guides/ai` 的入口链接有效
  - `docs/plan/active` 与 `docs/plan/archive` 的迁移链接有效
  - 运行 `pnpm nx run daily-use:governance-check`
- 契约与服务：
  - 覆盖 `clarification`、`draft`、`plan/confirm` 响应形态
  - 覆盖 clarification -> draft 两步流
  - 覆盖 confirm 不重规划
- 前端：
  - 覆盖阶段切换、澄清回答、draft 编辑、plan/confirm、状态恢复
- 执行层：
  - 覆盖 side-effect actions 未确认不执行
  - 覆盖 partial success 和 failed action 回显

## Assumptions

- 文档语言统一使用中文，必要时保留英文架构术语。
- 不再创建 `docs/guides/ai/plan` 作为第二套计划目录。
- 不引入向后兼容 shim，允许直接收敛旧 contracts 和旧文档表述。
- 历史文档中的旧命令、旧路径和旧阶段命名保留为历史上下文，不再作为当前真值。
