---
tags:
  - guide
  - development
  - ai
  - goal
description: 当前 Mastra-native goal.create durable workflow 与业务写入边界
created: 2026-04-15T00:00:00
updated: 2026-08-22T12:50:00+08:00
---

# AI 创建 Goal 当前工作流

`goal.create` 是 ADR-052 的参考 durable workflow，也是 Task/Knowledge vNext 迁移采用的模板。

## 主链路

```text
AIChatView / AIGoalWorkflowPanel
  → useAIGoalWorkflow
  → WorkflowRuntimeClient.start/resume/get/list/cancel
  → MastraAIRuntime
  → goal.create Mastra workflow
  → GoalPlannerWorker
  → clarification / review / revise / reject / approve
  → ApplyGoalPlanService
  → GoalPlanMutationPort
  → Goal / Task / Reminder application ports
```

不存在 AgentRun/ProposalKernel 第二套 approval lifecycle，也不存在 Python LangGraph fallback。

## 状态 authority

- Workflow execution/snapshot：Mastra storage。
- UI：`AIWorkflowRunView` 的薄投影，不拥有 workflow 状态机。
- Goal/KR/Task/Reminder：对应 domain/application module。
- Provider/model：ProviderConfig + MastraModelResolver。
- Token/cost/trace：execution log。

页面刷新/进程重启后通过 `get/list` 从 durable snapshot 恢复；不能从 localStorage 恢复一套并行业务 workflow truth。

## Planning

`GoalPlannerWorker` 使用 typed structured output。每次 `agent.generate()`：

- dynamic model resolver 解析 provider/model；
- RequestContext 只保留安全关联字段；
- planner log 记录 mode、conversationId、workflow runId、request/trace、provider/model、token/cost；
- raw prompt 不写 observability log。

信息不足时 workflow suspend，等待 typed clarification command；review 阶段允许 revise/reject/approve。

## Apply boundary

Approve 后由 `ApplyGoalPlanService` 调用 product-owned mutation adapter。Mastra workflow/tool 不 import Prisma/PowerSync repository 直接写 Goal 数据。

这保证：

- domain invariant 仍由 Goal/Task/Reminder application service 执行；
- retry/idempotency 可由 workflow + product mutation request id 控制；
- AI 失败不会制造半套 shadow domain model；
- 前端不会通过 AgentAction DAG 自己执行业务写入。

## Usage

Workflow view 会按 `runId + identityId` 从 execution log 聚合 planner token/cost，并投影到 `AIWorkflowRunView.usage`。`AIGoalWorkflowPanel` 使用 `AIRuntimeUsageBadge` 展示 durable run usage。

## 关键验证

- clarification / revise / reject / approve；
- cancel；
- retry/idempotency；
- identity isolation；
- restart recovery；
- product mutation port ownership；
- usage/cost durable projection；
- Web 11 场景 AI workspace Playwright journey。

## 关键文件

- `packages/ai/src/server/mastra/workflows/goal-create.workflow.ts`
- `packages/ai/src/server/mastra/agents/goal-planner.worker.ts`
- `packages/ai/src/server/mastra/runtime/mastra-ai.runtime.ts`
- `packages/ai/src/server/application/services/apply-goal-plan.service.ts`
- `apps/api/src/modules/ai/goal-plan-mutation.adapter.ts`
- `apps/desktop/src/main/modules/ai/goal-plan-mutation.adapter.ts`
- `packages/app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts`
- `packages/app-vue/src/modules/ai/components/AIGoalWorkflowPanel.vue`
