---
tags:
  - guide
  - development
  - ai
  - goal
description: 当前 AI 创建 Goal 工作流说明，聚焦 Chat Goal Tool 主线、保留的执行能力层与后续收敛方向
created: 2026-04-15T00:00:00
updated: 2026-04-29T22:05:00
---

# AI 创建 Goal 当前工作流说明

这篇文档讲的是**仓库当前真实存在的实现**，不是理想状态。

先给一句话版本：

**当前主产品流已经收敛到 AI Chat 页的 Goal Tool；旧的 goal automation 更适合被理解为保留中的规划/执行能力层，而不是当前主入口。**

## 先看结论

如果你刚接这个模块，先记住这 5 件事：

- 当前用户真正能稳定走通的主流程，是 `AIChatView` 里的 `goal` workflow。
- 这条链路当前的核心是：`chat context -> goal draft -> edit -> create goal`。
- `goal automation` 的 planning / execution 能力仍然存在，但独立 public API 与旧弹窗入口已经移除。
- automation 最有价值的不是独立面板，而是其中的 `plan / confirm / execute` 思想，以及 tool executor、execution log、approved actions 复用机制。
- 后续更合理的方向不是继续维护两条并行产品流，而是：**以 Chat Goal Tool 为唯一主线，吸收 automation 的 planning 和 execution 能力。**

## 当前主入口在哪里

当前主入口在：

- [packages/app-vue/src/modules/ai/views/AIChatView.vue](../../../packages/app-vue/src/modules/ai/views/AIChatView.vue)

这里的 `toolMode` 当前明确支持：

- `chat`
- `goal`
- `knowledge-note`

Goal 相关的可用动作主要是：

- `generateGoalDraftFromConversation()`
- `handleCreateGoalFromDraft()`
- `AIGoalDraftEditor` 中的手动编辑确认

也就是说，当前主产品体验已经不是“打开一个自动化工具箱”，而是：

`进入 AI Chat -> 切到 goal mode -> 根据对话生成 goal draft -> 用户编辑 -> 创建真实 goal`

## 为什么说旧 automation 不是当前主入口

仓库里当前保留的 automation 相关实现主要是能力层和执行器：

- [packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts](../../../packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts)
- [apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts)
- [apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts](../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts)

但从当前页面接线看：

- 旧 `AIWorkspaceToolbox` 与相关弹窗代码已经删除
- `AIChatView` 的工具菜单就是当前唯一的主工作流入口

所以更准确的表述不是“automation 能力消失了”，而是：

- **能力层仍在**
- **独立 public API 已删除**
- **产品层主入口已经收敛到 chat goal workflow**

## 当前系统边界

## 1. AI 模块不是业务主模块

无论是 draft 生成还是 automation planning，AI 模块当前都更像：

- 规划层
- 编排层
- 执行协调层

真正写业务数据的仍然是：

- `goal` 模块
- `task` 模块
- `repository` 模块

这条边界现在是对的，后续不应该打破。

## 2. AI 默认先产出结构化中间态，而不是直接落库

当前常见中间态包括：

- `GeneratedGoalDraft`
- automation `plan`
- `actions`

这说明系统的真实设计意图是：

- 先生成可审阅的结构化建议
- 再由用户审批或业务执行器执行

这也是后续升级成 Agent workflow 的基础。

## 3. 运行时能力是分层的

AI 模块当前存在运行时模式区分：

- `direct-provider`
- `remote-ai-service`

并通过 capability 判断是否支持：

- goal generation
- goal automation
- knowledge query
- analytics query
- evaluation reports

这说明系统已经具备“能力开关”意识，而不是所有功能天然永久可用。

## 当前主工作流：Chat Goal Tool

当前最重要的链路是这条：

`AIChatView -> generateGoalDraftFromConversation -> AI goal generation service -> goalPlanningPort -> 结构化 draft -> AIGoalDraftEditor -> useGoal.createGoal/addKeyResult -> goal 模块落库`

## 第 1 步：聊天上下文收集

Goal workflow 的输入不是单独表单，而是：

- 当前 conversation 里的消息
- 前端拼出的 transcript
- 当前选中的 provider/model

这使得 Goal 创建天然带有“会话上下文驱动”的特性。

## 第 2 步：生成结构化 draft

前端会调用 `service.generateGoal(...)`，由 AI 模块负责编排：

- provider 解析
- prompt / schema 约束
- goalPlanningPort 调用
- execution log 记录

无论最终是 direct provider 还是 remote ai-service，返回给前端的都是结构化 draft，而不是业务实体。

## 第 3 步：前端编辑与确认

draft 返回后，前端会：

- 映射到可编辑表单状态
- 展示 `AIGoalDraftEditor`
- 允许用户修改 goal 和 KR 字段

这一步是当前 chat goal workflow 最成熟、最接近真实产品的一层。

此外，`AIChatView` 当前已经把 goal workflow 明确整理成前端阶段机：

- `collect`
- `clarification`
- `draft`
- `plan`
- `confirm`
- `execute`
- `result`

其中 `plan / confirm / execute / result` 主要用于聊天页内的 UI 状态表达与恢复；请求侧当前已经统一成 `command: 'draft' | 'prepare' | 'execute'`，后端统一 response contract 则进一步收敛为 `clarification | draft | confirm | result`，也就是“待确认方案”直接表达为 `confirm`，而不是再暴露独立 `plan` 响应态；执行阶段仍然是同步完成后直接返回 `result`。不过 `result` 现在已经不只是原始 `executedActions` 列表，还额外带有 `executionSummary + recovery`，聊天页会直接展示 execution timeline、partial success / failed action 状态和恢复建议。

另外，`ai-service` 现在已经进入 provider-native tool calling 阶段，并完成了第一版可复用 runtime：

- OpenAI-compatible provider 可以在 non-streaming completion 里返回原生 `tool_calls`
- goal automation planning 会优先使用 `submit_goal_automation_plan` 这个 provider-native function 来提交最终 automation plan
- 在提供 repository resources 的内部链路上，goal automation planning 已能自动执行 `search_notes`
- 在提供 analytics context 的内部链路上，goal automation planning 已能自动执行 `fetch_stats`
- 读工具执行后的继续规划，当前已通过结构化 `assistant/tool` message 回合回灌到 provider，不再依赖临时文本 prompt
- 当前这套回合控制、usage 累加和 assistant/tool 消息重建已经抽成通用 provider tool runtime，goal automation 只是第一条落地链路
- `ai-service` orchestrator 当前已落地七条 handler：`goal`、`goal-automation`、`analytics`、`knowledge`、`knowledge-note`、`knowledge-index` 和 `knowledge-expand`
- 这些 internal workflow transport 现在全部统一收口到 `/internal/workflows/{type}`；旧的 `/internal/goals/*`、`/internal/analytics/query`、`/internal/knowledge/*` 平行 route 已删除
- 当前还不是覆盖所有 workflow 的完整通用多轮 agent runtime；聊天页主链路暂时也还没有直接暴露这些只读工具上下文，只在统一 `generateGoal(command: 'prepare')` 的服务端链路内部使用

## 第 4 步：真实创建

用户点击创建后，已经不再走 AI 模块。

真实落库是：

- `useGoal().createGoal(...)`
- `useGoal().addKeyResult(...)`

也就是说：

- AI 负责建议
- 领域模块负责真实业务创建

## 保留实现：Automation 能力层

虽然当前不是主入口，但 automation 里仍然有几块非常值得保留和复用的资产。

## 1. plan / confirm / execute 分层

[goal-generation-application-service.ts](../../../packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts) 当前已经明确区分：

- 第一次请求：生成 plan
- 第二次请求：基于 `approvedPlan + approvedActions` 执行

这避免了“确认时模型再次偷偷改计划”。

## 2. side-effect tool 的确认闸门

当前 `create_goal`、`create_key_result`、`create_task_template` 都属于 side-effect tools。

这说明系统已经有正确的安全边界意识：

- 查询类动作可以自动跑
- 写业务数据的动作必须确认

## 3. tool executor 与领域模块的边界

[backend-automation-tool-executor.adapter.ts](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts) 当前已经把执行控制在应用层门面之上，而不是让模型直接碰仓储或数据库。

这点很重要，后续统一 Agent workflow 时应该继续保持。

## 4. execution log / request id / executedActions

automation service 当前已经具备：

- request id
- completed / failed execution log
- executedActions 返回

这些能力都应该被抽到未来统一的 Goal workflow 执行阶段里。

## 当前文档上最容易误解的地方

如果你只看旧说法，很容易误以为：

- chat draft chain 和 automation chain 是并列主产品流
- 已删除的 `AIWorkspaceToolbox` 仍然是当前主要入口
- 后续应该继续分别把这两条流各自做强

这已经不再符合当前产品现实。

更准确的理解应该是：

- **当前主产品流：Chat Goal Tool**
- **当前保留实现：Automation planning / execution capability**
- **后续方向：把 automation 的优点吸收到 chat 主链路里**

## 更合理的目标形态

如果继续演进，一个更统一的 Goal workflow 应该是：

`chat context -> clarification -> draft -> review/edit -> plan -> confirm -> execute -> timeline/result`

这条链路里：

- 来自 chat 的部分：
  - 用户入口
  - conversation transcript
  - draft editor
  - 会话级 workflow 状态恢复
- 来自 automation 的部分：
  - plan / execute 分离
  - confirm gate
  - side-effect action 显式化
  - action executor
  - executedActions / executionSummary / recovery / observability

## 新人建议的阅读顺序

按当前现实，建议这样读：

1. 先看 [AIChatView.vue](../../../packages/app-vue/src/modules/ai/views/AIChatView.vue)，理解 chat goal workflow 是怎么跑通的。
2. 再看 `generateGoalDraftFromConversation()`、`handleCreateGoalFromDraft()`，理解 draft 与真实创建的边界。
3. 再看 goal generation application service 和 `goal_planning_service.py`，理解结构化 draft 是怎么来的。
4. 然后再看 `goal-generation-application-service.ts` 里统一后的 `plan / execute` 分支，把它当成当前统一工作流的执行能力层来读。
5. 最后看 `backend-automation-tool-executor.adapter.ts`，理解未来执行阶段可复用的能力边界。

## 一句话记忆版

**当前 AI 创建 Goal 的主流已经不是“两套并行入口”，而是“Chat Goal Tool 是唯一主产品流，automation 是保留中的规划与执行能力层”。**
