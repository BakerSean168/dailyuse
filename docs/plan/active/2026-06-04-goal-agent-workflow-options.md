---
tags:
  - plan
  - active
  - ai
  - agent
  - goal
  - workflow
description: Goal Agent 目标创建 workflow 方案，覆盖澄清、草稿、计划、确认、执行和恢复
created: 2026-06-04T00:00:00
updated: 2026-06-04T00:00:00
---

# Goal Agent Workflow 方案

## 1. 目标

Goal Agent 的目标不是简单“生成一个 goal title”，而是帮助用户把模糊想法变成可执行、可复盘、可写入系统的目标结构。

推荐主流程：

`intake -> retrieve_context -> clarify -> draft_goal -> validate_draft -> plan_actions -> approval_interrupt -> execute_actions -> result`

这条流程吸收当前 chat goal workflow 的入口优势，也吸收 goal automation 的 plan / confirm / execute 思想。

## 2. 多方案比较

### 方案 A：继续 Chat Draft Only

流程：

`chat context -> draft -> edit -> create goal`

优点：

- 当前最接近已跑通。
- 前端改动小。
- 风险低。

缺点：

- Agent 感不足。
- 不适合创建 KR、任务模板、提醒和复盘节奏。
- 缺少统一执行计划和执行结果。

适用：

- 只做短期 UI 提升。

### 方案 B：Goal Workflow 显式状态机

流程：

`intake -> clarify -> draft -> plan -> confirm -> execute -> result`

优点：

- 与当前产品边界一致。
- 适合前端展示结构化草稿和确认面板。
- 可以不引入外部 runtime 先落地。

缺点：

- checkpoint/resume/event 仍需自研。
- 后续扩展到 Knowledge Agent 时会重复造 runtime。

适用：

- 作为引入 LangGraph 前的过渡。

### 方案 C：LangGraph Goal Agent

流程：

`intake -> retrieve_context -> clarify -> draft_goal -> validate_draft -> plan_actions -> approval_interrupt -> execute_actions -> result`

优点：

- 阶段清晰。
- interrupt 适合用户确认。
- checkpoint 适合刷新恢复和失败重试。
- 可输出节点级事件。

缺点：

- 新增依赖。
- 需要封装现有 service 到 graph node。

推荐程度：最高。

## 3. 推荐 Workflow

### 3.1 intake

输入：

- 当前 conversation transcript。
- 用户最新输入。
- 用户选择的意图按钮。
- provider config。

输出：

- `goal_intent`
- `raw_idea`
- `candidate_category`
- `candidate_timeframe`
- `confidence`

职责：

- 判断用户是否真的要创建目标。
- 把口语输入转为目标意图。
- 如果只是普通聊天，不进入 Goal Agent。

### 3.2 retrieve_context

只读工具：

- `search_existing_goals`
- `search_knowledge`
- `fetch_goal_stats`

输出：

- 相关现有目标。
- 相关知识笔记。
- 近期执行统计。

职责：

- 避免重复目标。
- 用用户已有知识和历史目标增强草稿。
- 不做任何写入。

### 3.3 clarify

输入：

- `goal_intent`
- `retrieved_context`

输出：

- `clarification_questions`
- 或 `clarification_not_needed`

规则：

- 最多追问 2-4 个问题。
- 只问会影响目标结构的问题。
- 如果已有上下文足够，直接进入 draft。

常见问题类型：

- 成功标准是什么。
- 期望期限是什么。
- 每周可投入多少时间。
- 更偏学习、产出、健康、财务还是项目交付。

### 3.4 draft_goal

输出：

- `goal`
- `key_results`
- `task_templates`
- `review_cadence`
- `assumptions`

草稿字段：

- title。
- description。
- category。
- importance。
- start date / target date。
- motivation。
- feasibility analysis。
- tags。
- 2-4 个 KR。
- 可选任务模板。
- 可选复盘提醒建议。

规则：

- 草稿是 artifact，不是真实业务实体。
- 前端右侧面板必须可编辑。

### 3.5 validate_draft

检查：

- 目标是否过大或过虚。
- KR 是否可衡量。
- 时间范围是否合理。
- KR 权重是否合理。
- 任务模板是否能支持 KR。
- 是否与已有目标冲突。

输出：

- `validation_status`
- `warnings`
- `recommended_edits`

规则：

- 严重问题返回给用户修改。
- 轻微问题进入 plan，但在确认面板提示。

### 3.6 plan_actions

输出：

- `summary`
- `plan`
- `pending_actions`

pending actions 示例：

- `create_goal`
- `create_key_result`
- `create_task_template`
- `create_reminder`

规则：

- 每个 action 必须包含 tool、payload、rationale、index。
- side-effect action 全部等待确认。
- read-only action 不进入确认面板。

### 3.7 approval_interrupt

暂停点。

前端展示：

- 将创建的目标。
- 将创建的 KR。
- 将创建的任务模板。
- 将创建的提醒/复盘节奏。
- AI 补全内容和用户原始输入。
- 可编辑字段。
- 确认、取消、重新生成。

resume payload：

- `approved_plan`
- `approved_actions`
- `edited_goal`
- `edited_key_results`
- `edited_task_templates`
- `user_decision`

规则：

- 用户取消后 run 标记为 `cancelled`。
- 用户编辑后执行编辑后的 artifact。
- 确认后不再次让模型改计划。

### 3.8 execute_actions

执行边界：

- Python agent runtime 不直接写业务数据库。
- 执行委托给 TS application layer 的 controlled executor。
- executor 调用 Goal、Task、Reminder 等业务模块。

执行结果：

- `executed_actions`
- `execution_summary`
- `recovery`

失败策略：

- 单个 KR 创建失败时，目标已创建则返回 partial。
- task/reminder 创建失败不回滚目标，但展示恢复建议。
- 支持用同一 approved plan 重试失败 action。

### 3.9 result

前端展示：

- 创建成功的目标入口。
- KR 和任务模板结果。
- 执行 timeline。
- 失败项和恢复建议。
- 后续动作：
  - 打开目标。
  - 规划本周行动。
  - 创建复盘提醒。
  - 把目标背景沉淀为知识笔记。

## 4. State Contract

建议内部 state：

```text
GoalAgentState
- run_id
- thread_id
- conversation_id
- raw_input
- goal_intent
- retrieved_context
- clarification
- draft
- validation
- plan
- pending_actions
- approved_actions
- executed_actions
- execution_summary
- recovery
- usage
- errors
```

## 5. 前端体验

主区：

- 显示对话和 Agent 解释。
- 不把大表单塞进对话气泡。

右侧面板：

- `ClarificationPanel`
- `GoalDraftPanel`
- `ActionPlanPanel`
- `ExecutionTimelinePanel`

底部输入：

- 用户可以继续补充。
- 处于确认阶段时，发送补充内容应视为“修改草稿/计划”，不是另开普通聊天。

## 6. 与当前实现的迁移关系

保留：

- `useAIGoalWorkflow` 的阶段表达。
- `AIGoalDraftEditor` 的编辑能力。
- `GenerateAIGoalUseCase` 的 plan/execute 分支思想。
- `backend-automation-tool-executor.adapter.ts` 的受控执行边界。

调整：

- 把 `goal` 和 `goal-automation` 的概念统一为 Goal Agent workflow。
- 前端不要暴露技术词 `automation`，只展示“执行计划”和“确认创建”。
- Python service 内部从 handler 直接 service 调用升级为 graph node 调用。

## 7. 验收标准

- 用户用一句话可以进入 Goal Agent。
- 信息不足时 Agent 主动追问 2-4 个关键问题。
- 用户能在确认前编辑 goal/KR/task。
- 确认前不会创建任何真实业务对象。
- 确认后执行的是用户批准的 plan/actions。
- 创建结果展示 timeline、成功/失败/跳过状态。
- 失败时可明确重试或手动修复。
