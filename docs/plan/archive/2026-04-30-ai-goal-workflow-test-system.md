---
tags:
  - plan
  - archive
  - ai
  - goal
  - workflow
  - test
description: AI goal workflow 快速测试系统实施计划
created: 2026-04-30T00:00:00
updated: 2026-04-30T00:00:00
status: archived
---

> 归档说明：`ai-service` goal workflow eval harness、cases、baseline 与 Nx target 已完成，本文仅保留为测试系统实施记录。

# AI Goal Workflow Test System

## Summary

以 `apps/ai-service` 为核心，扩展现有 eval runner，新增一套专门面向 `ai-goal-workflow` 的 deterministic-first workflow harness。

这套 harness 只覆盖 `goal` / `goal-automation` 编排与推断，不包含 chat SSE、消息持久化或真实业务写入；`execute` 阶段默认使用 fake executor，输出与当前 goal workflow 结果模型对齐的 `summary / actions / executionSummary / recovery`，用于本地快速回归和后续 CI gate。

## Key Changes

### 1. 在 `apps/ai-service/src/ai_service/evals/runner.py` 增加 `goal_workflow` case 类型

新增 `GoalWorkflowEvalCase`，字段固定为：

- `id`, `type="goal_workflow"`, `description`
- `initial_request`
  包含 `idea`, `category?`, `timeframe?`, `include_key_results`, `include_task_templates`
- `clarification_answers?`
  仅在首轮返回 clarification 时使用
- `provider_script`
  按顺序声明 fake provider 返回的 `ChatCompleteResponse` 脚本，支持普通 JSON content 和 native `toolCalls`
- `related_resources?`, `analytics_context?`
  用于覆盖 `search_notes` / `fetch_stats` 只读工具链路
- `fake_execution`
  用于声明每个 action 的执行结果；默认按 action 顺序执行，可按 `tool + index` 覆盖状态、message、entityId
- `expected`
  包含 `stage_sequence`, `action_tools`, `execution_status`, `can_retry`, `goal_terms?`, `required_tool_calls?`, `required_recovery_terms?`

### 2. 新增 workflow harness，但不新开 HTTP/UI 层

新增内部 harness 模块，职责固定：

- 实例化真实 `GoalPlanningService`
- 通过 `GoalWorkflowHandler` 调用 `plan_with_clarification`
- 在需要时自动补入 `clarification_answers` 再跑第二轮 draft
- 通过 `GoalAutomationWorkflowHandler` 调用 `plan_automation`
- 对返回的 side-effect actions 执行 fake executor
- 生成统一 trace：
  `clarification -> draft -> confirm -> result`
- 输出标准化结果：
  `draft 摘要 + action 列表 + tool loop 痕迹 + executionSummary + recovery + failure stage`

harness 直接走 orchestrator/service，不走 `/internal/workflows/*` HTTP route，也不依赖 TS 侧 `GoalGenerationApplicationService`。

### 3. 引入 fake executor，模拟 execute 但不写业务数据

fake executor 规则固定：

- 默认支持 `create_goal`, `create_key_result`, `create_task_template`
- 不访问数据库，不调用真实 domain facade
- 默认成功策略：
  `create_goal` 产出稳定 fake `entityId`
  其他 action 默认 `executed`
- case 可覆盖为 `failed` 或 `skipped`
- `executionSummary` 和 `recovery` 规则对齐当前 TS workflow 语义：
  `success | partial | failed`
  以及按 tool 类型生成恢复建议

这层是 v1 的“推断器”，不是生产执行器。

### 4. 复用现有 eval 体系，不另造第二套报告协议

在 `apps/ai-service/evals/` 新增：

- `goal_workflow_cases.json`
- `goal_workflow_policy.json`
- `goal_workflow_baseline.json`
- `goal_workflow_live_cases.json`
- `goal_workflow_live_policy.json`
- `goal_workflow_live_baseline.json`

报告输出固定为：

- `reports/apps/ai-service/evals/goal-workflow-latest.json`
- `reports/apps/ai-service/evals/goal-workflow-history/`
- live 版对应 `goal-workflow-live-*`

CLI 扩展固定支持：

- `--cases`
- `--policy`
- `--baseline`
- `--output`
- `--archive-dir`
- `--case-id`
  只跑单 case，作为本地快速调试主入口
- `--mode deterministic|live`

### 5. 新增 Nx 入口，作为正式开发入口

在 `apps/ai-service/project.json` 新增两个 target：

- `goal-workflow-eval`
  默认 deterministic，面向日常快速测试
- `goal-workflow-eval-live`
  小规模真模型抽检，不进默认本地循环

不新增 Debug UI；v1 统一从 `pnpm nx run ai-service:goal-workflow-eval` 进入。

## Public Interfaces / Types

新增或扩展的公开接口仅限内部测试系统：

- `GoalWorkflowEvalCase` case schema
- runner CLI 新参数：`--case-id`
- report metadata 新增 workflow trace 字段：
  `stages`, `tool_calls_seen`, `executed_actions`, `execution_status`, `failure_stage`

现有产品 API、`GenerateGoalsReq/Res`、`/internal/workflows/goal` 与 `/goal-automation` contract 不改。

## Test Plan

必须补齐这些自动化场景：

- `clarification -> draft -> confirm -> fake execute success`
- `clarification -> draft -> confirm -> fake execute partial failure`
- `draft 直接成功，无 clarification`
- `prepare` 阶段触发 `search_notes` tool loop
- `prepare` 阶段触发 `fetch_stats` tool loop
- provider 返回无效 plan payload，结果明确标出失败阶段
- `--case-id` 仅运行单 case
- deterministic baseline 全量通过
- live suite 只保留 1 到 3 个高价值 smoke case，不追求覆盖面

同时补 runner 自测：

- case schema 校验
- fake executor 状态归约
- recovery 建议生成
- trace 结构稳定
- baseline / policy gate 正常工作

## Assumptions

- 当前要解决的是“快速推断与回归”，不是修复 `AIChatApplicationService` 的流式中断问题。
- v1 明确不覆盖 chat transport、SSE、中止传播、消息持久化。
- 默认不做真实业务写入，所有 execute 结果都来自 fake executor。
- 默认离线 deterministic；live provider 只作为补充 target，不进入主回归。
- 继续复用现有 eval runner、policy、baseline 机制，而不是新建独立 playground 或第二套测试框架。
