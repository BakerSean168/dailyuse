---
tags:
  - guide
  - ai
  - goal
  - automation
description: 当前 v1 Goal automation 的 plan、confirm、execute 链路说明
created: 2026-04-19T00:00:00
updated: 2026-04-19T00:00:00
---

# Goal Automation 链路

这条链路不是聊天页“创建目标”按钮的后半段。

它是一条单独的链路，入口在工作区工具箱，目标是：

`idea -> automation plan -> 用户确认 -> executor 调 goal/task 模块执行`

## 1. 入口在 `AIWorkspaceToolbox.vue`

核心文件：

- [../../../packages/app-vue/src/modules/ai/components/AIWorkspaceToolbox.vue](../../../packages/app-vue/src/modules/ai/components/AIWorkspaceToolbox.vue)

当前页面会先读取 capability：

- `supportsGoalAutomation`

只有 capability 为真时，工具箱里的自动化目标设置才可用。

## 2. automation 是两阶段，不是一阶段

### 阶段 A：先规划

`handlePlanAutomation()` 发送：

- `idea`
- `includeKeyResults: true`
- `includeTaskTemplates: true`
- `confirm: false`

### 阶段 B：确认后执行

`handleExecuteAutomation()` 会把上一步拿到的结果重新提交：

- `confirm: true`
- `approvedSummary`
- `approvedPlan`
- `approvedActions`

这说明当前 v1 的 contract 很明确：

- 第一次请求拿计划
- 第二次请求拿已经批准的计划去执行

## 3. transport 入口是 `/api/v1/ai/generate/goal-automation`

核心文件：

- [../../../packages/ai/src/api/routes/ai-goal-automation.routes.ts](../../../packages/ai/src/api/routes/ai-goal-automation.routes.ts)
- [../../../packages/ai/src/api/controllers/ai-goal-automation.controller.ts](../../../packages/ai/src/api/controllers/ai-goal-automation.controller.ts)

controller 用 `GenerateGoalAutomationSchema` 做校验，然后把参数交给 service。

## 4. automation 的编排核心在 `AIGoalAutomationService`

核心文件：

- [../../../packages/ai/src/application-server/use-cases/commands/ai-goal-automation.service.ts](../../../packages/ai/src/application-server/use-cases/commands/ai-goal-automation.service.ts)

当前逻辑顺序是：

1. 创建 `requestId`
2. 解析真实 provider config
3. 组装模型配置，当前温度是 `0.2`
4. 决定是“重新规划”还是“使用 approved plan”
5. 计算 `requiresConfirmation`
6. 判断本次请求是否真的执行
7. 如需执行，则调用 `toolExecutorPort.executeGoalAutomation(...)`
8. 记录 execution log

## 5. `confirm: true` 时，当前服务会信任已批准计划

这是 v1 一个很关键的行为：

当下面条件同时满足时：

- `request.confirm === true`
- `request.approvedPlan` 存在
- `request.approvedActions` 有内容

service 会直接把这份 `approvedPlan + approvedActions` 组装成 `approvedPlan` 对象，而不是再次调用 planner。

并且这条路径下：

- `usage.promptTokens = 0`
- `usage.completionTokens = 0`
- `usage.totalTokens = 0`

也就是说，执行阶段默认是“执行你刚批准的计划”，不是“重新问模型再执行一遍”。

## 6. 什么动作会触发二次确认

当前 service 用一个固定集合判断：

- `create_goal`
- `create_key_result`
- `create_task_template`

只要 plan.actions 里出现这些副作用工具，就会把 `requiresConfirmation` 设成真。

相对地：

- `search_notes`
- `fetch_stats`

不属于 side effect tool。

## 7. planning port 当前只有 remote ai-service 版本

核心文件：

- [../../../packages/ai/src/infrastructure-server/chat-execution/ai-service-goal-automation.adapter.ts](../../../packages/ai/src/infrastructure-server/chat-execution/ai-service-goal-automation.adapter.ts)
- [../../../apps/ai-service/src/ai_service/api/routes/goals.py](../../../apps/ai-service/src/ai_service/api/routes/goals.py)
- [../../../apps/ai-service/src/ai_service/services/goal_planning_service.py](../../../apps/ai-service/src/ai_service/services/goal_planning_service.py)

当前 automation planning 会发到：

- `POST /internal/goals/plan-actions`

这和聊天 draft 的 `POST /internal/goals/plan` 是两条不同的内部路由。

## 8. Python planner 返回的不是执行结果，而是执行计划

`GoalPlanningService.plan_automation(...)` 负责生成：

- `summary`
- `goal`
- `keyResults`
- `taskTemplates`
- `toolCalls`

当前 Python prompt 对模型提出了这些硬约束：

- 允许的 tool 只有 `create_goal / create_key_result / create_task_template / search_notes / fetch_stats`
- `create_goal` 必须正好出现一次
- `create_key_result` 和 `create_task_template` 的 `index` 要对应数组项

这意味着当前 automation 不是“自由 agent”，而是非常受限的结构化 planner。

## 9. 真正执行在 automation executor，而不是 planner

执行器接口：

- `IAIAutomationToolExecutorPort`

具体实现：

- API 侧：[../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts)
- Desktop 侧：[../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts](../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts)

两边逻辑几乎一致，差别主要在底层 repository / database 适配器不同。

## 10. executor 当前怎么执行每一种 action

### `create_goal`

先调用 goal 模块的 `createGoal(...)`，并把返回的 `goal.id` 记到 `createdGoalId`。

### `create_key_result`

要求前面已经创建了 goal。

然后通过 `action.index` 取 `plan.keyResults[index]`，再调用 goal 模块的 `addKeyResult(...)`。

执行成功后，会把创建出来的 `keyResult.id` 缓存在 `createdKeyResultIds` 里。

### `create_task_template`

通过 `action.index` 取 `plan.taskTemplates[index]`，再调用 task 模块的 `createTaskTemplate.execute(...)`。

如果当前 index 对应的 key result 也已经成功创建，就会建立 `goalBinding`。

这表示当前 v1 默认采用一种非常具体的约定：

- `taskTemplates[index]` 和 `keyResults[index]` 被认为是可绑定的一组

### `search_notes`

当前只做知识资源查询，并在 `executedActions` 里写一条说明消息，不会修改 plan。

### `fetch_stats`

当前只读取 analytics context，并在 `executedActions` 里写一条说明消息，不会修改 plan。

## 11. 当前执行模型是“逐 action 尝试，不回滚”

executor 的 `for ... of input.actions` 每一步都有独立的 `try/catch`。

这意味着：

- 某个 action 失败，不会自动回滚前面已成功的 action
- 后续 action 仍然可能继续执行
- 最终调用方看到的是一组 `executed / failed / skipped` 状态

这是一种很典型的 v1 实现：可追踪、简单，但不是事务式编排。

## 12. 当前 automation 响应里最该关注的字段

- `summary`
- `requiresConfirmation`
- `plan`
- `actions`
- `executedActions`
- `providerId`
- `tokenUsage`
- `processingTimeMs`

判断当前请求是“只规划”还是“已经执行”，最直接的方法是看：

- `requiresConfirmation`
- `executedActions` 是否存在

## 13. 这条链路里的关键文件

- 工具箱 UI：[../../../packages/app-vue/src/modules/ai/components/AIWorkspaceToolbox.vue](../../../packages/app-vue/src/modules/ai/components/AIWorkspaceToolbox.vue)
- automation controller：[../../../packages/ai/src/api/controllers/ai-goal-automation.controller.ts](../../../packages/ai/src/api/controllers/ai-goal-automation.controller.ts)
- automation service：[../../../packages/ai/src/application-server/use-cases/commands/ai-goal-automation.service.ts](../../../packages/ai/src/application-server/use-cases/commands/ai-goal-automation.service.ts)
- automation adapter：[../../../packages/ai/src/infrastructure-server/chat-execution/ai-service-goal-automation.adapter.ts](../../../packages/ai/src/infrastructure-server/chat-execution/ai-service-goal-automation.adapter.ts)
- Python planner：[../../../apps/ai-service/src/ai_service/services/goal_planning_service.py](../../../apps/ai-service/src/ai_service/services/goal_planning_service.py)
- API executor：[../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts)
- Desktop executor：[../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts](../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts)
