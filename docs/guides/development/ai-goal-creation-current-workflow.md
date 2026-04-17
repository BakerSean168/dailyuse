---
tags:
  - guide
  - development
  - ai
  - goal
description: 当前 AI 创建目标工作流说明，覆盖对话草稿、自动化执行、分层结构、运行时差异和调试入口
created: 2026-04-15T00:00:00
updated: 2026-04-15T00:00:00
---

# AI 创建目标当前工作流说明

这篇文档讲的不是“理想中的 AI 目标系统应该怎么设计”，而是仓库里现在已经存在、正在运行的实现。

如果你是第一次接这个模块，先记住一句话：

**当前 AI 创建目标有两条链路，而且它们不是一回事。**

1. **对话生成目标草稿，再由前端确认创建真实目标**
2. **目标自动化：先规划动作，再二次确认执行真实创建**

很多新人一开始会把它们混成一条链，结果读代码时会很乱。实际代码里，这两条链路共享一部分基础设施，但入口、数据形态、确认机制和最终执行方式都不一样。

## 先看结论

当前系统的核心设计是：

- AI **默认先产出结构化草稿/计划**，而不是直接落库。
- 真正的目标实体、关键结果实体、任务模板实体，仍然由 `goal` / `task` 模块负责创建。
- `ai` 模块更像“规划层”和“编排层”。
- 前端聊天页里的工作流状态，不全在服务端，很多是保存在本地 `localStorage` 的页面级衍生状态。
- 自动化能力依赖更完整的运行时；普通目标草稿生成则支持更轻量的直连 provider 模式。

## 你需要先懂的基础知识

### 1. 什么叫“草稿”而不是真实目标

在这个项目里，AI 生成目标时，先返回的是 `GeneratedGoalDraft` 这一类 DTO，而不是 `Goal` 聚合根本身。

这意味着：

- AI 返回的是“可编辑建议”
- 用户或自动化执行器再把建议转换成真实创建请求
- 真正入库的是 `CreateGoalReq`、`AddKeyResultReq` 这类业务请求

这样做的好处是很直接的：

- AI 输出不可信时，不会直接污染正式数据
- 前端可以让用户二次编辑
- AI 模块和 goal/task 模块职责边界更清楚

## 2. 什么是 controller / service / port / adapter

这一套在 `ai` 模块里很明显。

- **controller**：只负责校验输入、处理 transport 层错误
- **application service**：负责业务编排，比如选 provider、记 execution log、决定是否需要确认
- **port**：抽象能力接口，比如“目标规划端口”“自动化执行端口”
- **adapter**：具体实现，比如 HTTP、IPC、remote ai-service、direct provider

你可以把它理解成：

`页面 -> 客户端 service -> transport adapter -> controller -> application service -> port -> adapter -> 外部模型/内部模块`

## 3. 什么是“runtime mode”

AI 模块当前有两种运行方式：

- `direct-provider`
- `remote-ai-service`

它们的差别不是“前端长得不一样”，而是服务端到底把请求发到哪里。

- `direct-provider`：服务端自己直接调用兼容 OpenAI 的模型接口
- `remote-ai-service`：服务端再转发到独立的 `apps/ai-service`

当前能力上要注意：

- **目标草稿生成** 两种模式都支持
- **目标自动化** 只有在运行时注入了 `goalAutomationPlanningPort + automationToolExecutorPort` 时才可用

这也是为什么工作区工具箱里“自动化目标设置”会看 capability 开关，而不是默认永远可用。

## 整体架构图

先用最短路径把图记住：

### 链路 A：聊天生成草稿

`AIChatView -> useAI -> AIClientService -> AIGoalHttp/IpcAdapter -> AI goal route/controller/service -> goalPlanningPort -> 模型 -> 返回草稿 -> 前端确认 -> useGoal.createGoal/addKeyResult -> goal 模块落库`

### 链路 B：目标自动化

`AIWorkspaceToolbox -> useAI -> AIClientService -> automateGoal -> AI automation route/controller/service -> automation planning port -> 生成 plan/actions -> 二次确认 -> automationToolExecutor -> goal/task 模块落库`

## 关键代码入口

建议先按这个顺序看：

- [packages/app-vue/src/modules/ai/views/AIChatView.vue](../../../packages/app-vue/src/modules/ai/views/AIChatView.vue)
- [packages/app-vue/src/modules/ai/components/AIWorkspaceToolbox.vue](../../../packages/app-vue/src/modules/ai/components/AIWorkspaceToolbox.vue)
- [packages/app-vue/src/modules/ai/components/AIGoalDraftEditor.vue](../../../packages/app-vue/src/modules/ai/components/AIGoalDraftEditor.vue)
- [packages/app-vue/src/modules/ai/composables/useAI.ts](../../../packages/app-vue/src/modules/ai/composables/useAI.ts)
- [packages/ai/src/application-client/ai-client-service.ts](../../../packages/ai/src/application-client/ai-client-service.ts)
- [packages/ai/src/api/controllers/ai-goal-generation.controller.ts](../../../packages/ai/src/api/controllers/ai-goal-generation.controller.ts)
- [packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts](../../../packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts)
- [packages/ai/src/application-server/use-cases/commands/ai-goal-automation.service.ts](../../../packages/ai/src/application-server/use-cases/commands/ai-goal-automation.service.ts)
- [apps/ai-service/src/ai_service/services/goal_planning_service.py](../../../apps/ai-service/src/ai_service/services/goal_planning_service.py)
- [apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts)
- [apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts](../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts)
- [packages/goal/src/application-server/use-cases/commands/create-goal.ts](../../../packages/goal/src/application-server/use-cases/commands/create-goal.ts)

## 链路 A：聊天页里“生成目标草稿 -> 手动创建目标”

这是当前最容易被用户看到的 AI 创建目标流程。

### 第 1 步：进入 AI 聊天页，并切到 goal 工作流

`AIChatView.vue` 不是单纯聊天页，它同时复用了三个模式：

- `chat`
- `goal`
- `knowledge-note`

也就是说，目标生成并不是单独一个页面，而是“挂在聊天壳子里的工作流模式”。

这样做的直接结果是：

- 聊天消息和模型选择共用一套 UI
- 目标草稿是聊天上下文的衍生物
- 同一个 conversation 可以承载普通聊天或目标生成上下文

### 第 2 步：聊天消息走服务端，会话级工作流状态走本地

这是这个页面非常关键的一点。

服务端保存的是：

- conversation
- messages
- conversation title

前端本地保存的是：

- `toolMode`
- `goalDraft`
- `editableGoal`
- `editableKeyResults`
- `showGoalDraftEditor`
- `noteSummary`

这些工作流状态会按 conversation id 存进 `localStorage`，而不是作为 AI 会话的一部分回写到服务端。

所以你在调试时要分清：

- “消息没了”去查服务端 conversation/message
- “草稿没了”先看本地 workflow storage

### 第 3 步：点击“生成目标草稿”

按钮触发 `generateGoalDraftFromConversation()`。

这一步并不会直接创建目标，只会把当前聊天内容拼成 transcript，再发给 AI：

- `idea` 来自 `buildConversationTranscript()`
- `includeKeyResults` 固定传 `true`
- 当前选中的 `providerId` 和 `model` 也会一起传

这里的关键设计是：

- 输入给模型的不是某个单独表单
- 而是完整对话上下文的文本转录

也就是说，这套目标生成功能本质上是“对话驱动的结构化提取”。

### 第 4 步：前端 transport 层只负责把请求送到 AI 模块

前端统一调用 `useAI().service.generateGoal()`。

UI 不关心当前是 Web 还是 Desktop：

- Web 注入的是 HTTP adapter
- Desktop 注入的是 IPC adapter

所以页面层看到的是同一个 `AIClientService`，差别在 DI 层。

### 第 5 步：AI controller 做输入校验

到了服务端后，`AIGoalGenerationController` 会先用 `GenerateGoalsSchema` 做校验。

这里校验的只是 transport DTO，比如：

- `idea` 至少 10 个字符
- `providerId` 是否符合 branded id
- `model` 是否是字符串

controller 不负责 prompt，不负责创建 goal，更不负责直接访问数据库。

### 第 6 步：GoalGenerationApplicationService 做真正编排

`GoalGenerationApplicationService` 是这条链路的真正核心。

它主要做 4 件事：

1. 根据 `identityId` 和可选的 `providerId` 解析当前生效的 provider 配置
2. 组装模型执行配置，比如 model override、temperature
3. 调用 `goalPlanningPort.plan(...)`
4. 记录 AI execution log

这里要特别注意：

- UI 不直接决定最终可用的 provider config
- AI application service 会做一次“解析真实 provider 配置”的动作

所以如果你发现前端明明传了 providerId，但最终走的不是预期 provider，优先查这里。

### 第 7 步：goalPlanningPort 有两种实现

#### 实现 A：DirectProviderGoalPlanningAdapter

这条路径下：

- AI 模块自己调用兼容 OpenAI 的 gateway
- 使用本地 system prompt + user prompt
- 要求模型返回 JSON
- 再通过 `parseGoalPlanningResponse()` 做宽松解析和兜底

这条链路的特点是：

- 依赖更少
- 适合基本目标草稿生成
- 容错靠 TypeScript 侧手工 parse/normalize

#### 实现 B：AIServiceGoalPlanningAdapter

这条路径下：

- AI 模块把请求发给独立的 `apps/ai-service`
- 由 Python 服务负责 prompt、结构化 schema 校验和返回

这条链路的特点是：

- 结构化约束更集中
- 更容易扩展复杂 AI 能力
- 是更“正式”的 remote runtime

### 第 8 步：模型返回结构化 goal draft

不管是直连 provider 还是 remote ai-service，最后前端拿到的核心结果都类似：

- `goal`
- `keyResults`
- `tokenUsage`
- `providerId`
- `processingTimeMs`

其中 `goal` 是 AI 草稿，不是真实 goal 实体。

当前目标草稿 DTO 里常见字段有：

- `title`
- `description`
- `motivation`
- `category`
- `importance`
- `tags`
- `feasibilityAnalysis`
- `suggestedStartDate`
- `suggestedEndDate`

### 第 9 步：前端把 AI 草稿转换成“可编辑表单状态”

`applyGoalDraft()` 会把返回的 AI 结果映射成：

- `editableGoal`
- `editableKeyResults`

这一步非常重要，因为 AI 返回结构和表单编辑结构并不完全一样。

例如：

- `title` 会映射为表单里的 `name`
- `suggestedStartDate` / `suggestedEndDate` 会映射为 `startDate` / `targetDate`
- key result 会补默认 `valueType`、`calculationMethod`、`weight`

所以如果你改了 AI 返回 DTO，但忘了改 `applyGoalDraft()`，UI 往往会“生成成功但编辑器显示错字段”。

### 第 10 步：用户可以展开编辑器继续改

`AIGoalDraftEditor.vue` 是真正让用户确认前再编辑的地方。

它支持继续修改：

- 目标名称
- 描述
- 分类
- importance
- motivation
- feasibilityAnalysis
- tags
- 起止日期
- 关键结果列表
- 每个关键结果的 valueType / calculationMethod / targetValue / weight 等

这就是为什么说当前链路是“AI 生成草稿 + 人工确认”的模式，而不是“AI 直接代替业务创建”。

### 第 11 步：点击创建后，已经不再走 AI 模块

`handleCreateGoalFromDraft()` 做的事情很直接：

1. 调用 `useGoal().createGoal(...)`
2. 创建成功后，循环调用 `useGoal().addKeyResult(...)`
3. 最后跳转到新建目标详情页

这一步很关键，很多人第一次看代码会误以为：

“点击创建目标，应该继续走 `/ai/generate/goal` 的后半段吧？”

不是。

当前实现里：

- **AI 模块只负责生成草稿**
- **真实创建已经切回 goal 模块**

这说明目标模块仍然保持业务主权。

### 第 12 步：goal 模块完成真实创建

`CreateGoal` 用例会：

1. 校验 `name`、`identityId`
2. 如果有 `parentGoalId`，先查父目标
3. 用 `GoalPolicy` 做领域规则校验
4. 用 `Goal.create(...)` 创建聚合根
5. 调用 repository 保存

关键结果创建也类似，最终都由 goal 聚合负责，而不是由 AI 模块自己写表。

## 链路 B：目标自动化“先规划，再确认执行”

这条链路不在 `AIChatView` 里，而是在工作区工具箱 `AIWorkspaceToolbox.vue` 里。

它和“聊天页目标草稿”最大的区别是：

- 前者主要是给用户一个草稿
- 后者要生成“动作计划”，并且在确认后真的执行这些动作

### 第 1 步：用户输入 automation idea

入口在工具箱对话框。

用户先输入 idea，然后点击“规划自动化”。

此时前端会发：

- `idea`
- `includeKeyResults: true`
- `includeTaskTemplates: true`
- `confirm: false`

也就是说，第一轮请求明确是“只规划，不执行”。

### 第 2 步：AIGoalAutomationService 先决定是规划还是执行

这是这条链路的核心。

`AIGoalAutomationService` 做了一个非常关键的判断：

- 如果本次请求带着 `confirm: true + approvedPlan + approvedActions`
  - 直接复用已批准 plan
  - 不重新规划
- 否则
  - 先调用 planning port 让 AI 生成 automation plan

这意味着：

- 第二次“确认执行”请求，不会再让模型重新想一遍
- 执行的是用户已经看过并确认的 plan

这个设计非常重要，因为它避免了“确认时模型偷偷改计划”。

### 第 3 步：AI 先返回 plan 和 actions

automation plan 里会包含：

- `summary`
- `plan.goal`
- `plan.keyResults`
- `plan.taskTemplates`
- `actions`

其中 `actions` 是显式工具调用计划，例如：

- `create_goal`
- `create_key_result`
- `create_task_template`
- `search_notes`
- `fetch_stats`

这比普通 goal draft 多了一层“执行计划”。

### 第 4 步：系统判断是否需要确认

服务里维护了一个 `SIDE_EFFECT_TOOLS` 集合：

- `create_goal`
- `create_key_result`
- `create_task_template`

只要计划里出现这些动作，就认为是有副作用的操作，需要确认。

所以：

- 纯查询型动作可以直接执行
- 创建实体型动作必须二次确认

这就是当前自动化工作流的安全边界。

### 第 5 步：前端展示计划，用户二次确认

前端第一次拿到结果后，会展示：

- summary
- 目标草稿
- 动作列表
- 是否等待确认

如果 `requiresConfirmation === true`，前端会再显示“确认并执行”按钮。

第二次调用时，前端把以下内容原样带回去：

- `confirm: true`
- `approvedSummary`
- `approvedPlan`
- `approvedActions`

这一步不是装饰性的，它决定了执行器用的是不是“已批准计划”。

### 第 6 步：真正执行时，走 automationToolExecutor

如果可以执行，`AIGoalAutomationService` 会调用：

`toolExecutorPort.executeGoalAutomation(...)`

当前这条 port 在两端分别有实现：

- API 端：`BackendAutomationToolExecutorAdapter`
- Desktop 端：`DesktopAutomationToolExecutorAdapter`

两个实现逻辑几乎一致，区别主要在底层 repository：

- API 用 Prisma repository
- Desktop 用 PowerSync repository

### 第 7 步：执行器按 action 顺序创建真实实体

执行器会顺序遍历 `actions`。

#### `create_goal`

先创建真实 goal，并记录返回的 `goalId`。

#### `create_key_result`

要求前面已经创建过 goal。

然后根据 `action.index` 找到 plan 里的对应 KR 草稿，再调用 goal 模块的 `addKeyResult(...)`。

#### `create_task_template`

根据 task template 草稿创建真实任务模板。

如果当前 action index 对应的 key result 也已经创建成功，还会顺手建立 task 和 goal/key result 的绑定关系。

#### `search_notes`

不会落库，只会查询相关笔记并返回说明消息。

#### `fetch_stats`

不会落库，只会查询统计上下文并返回说明消息。

### 第 8 步：执行结果回前端

执行完成后，前端拿到的是 `executedActions` 列表，每个动作都会有：

- `tool`
- `status`
- `entityId`
- `message`

这允许 UI 给用户明确展示：

- 哪一步执行成功了
- 哪一步失败了
- 创建出了哪个实体

## 当前实现里最容易忽略的几个事实

### 1. 手动草稿链路和自动化链路的数据精细度不一样

聊天页目标草稿链路里，KR 草稿字段更完整，包含：

- `valueType`
- `calculationMethod`
- `startValue`
- `currentValue`
- `targetValue`
- `unit`
- `weight`

但 `apps/ai-service` 里的自动化 planning schema 目前更简化，KR 只要求：

- `title`
- `description`
- `targetValue`
- `unit`

到了执行器阶段，又会再补默认值，例如：

- `valueType` 固定成 `Incremental`
- 聚合方式固定成 `Last`
- `startValue/currentValue` 从 0 起
- `weight` 按 KR 数量估算

所以当前自动化创建出来的 KR，比聊天页手动确认链路更“粗粒度”。

这个不是 bug，而是当前实现阶段的真实状态。新人做改动时要注意不要默认两条链路字段完全等价。

### 2. automation 的“确认执行”不是重新规划

这是安全设计，不要轻易改掉。

如果第二次确认执行时又重新调模型，用户看到的 plan 和真正执行的 plan 就可能不一致。

当前实现专门通过 `approvedPlan + approvedActions` 避免了这个问题。

### 3. AI 页面的 workflow state 不是服务端单一事实源

消息历史是服务端事实源。

但 goal draft editor 的展开状态、编辑中的表单值、note summary 等，是本地状态。

这意味着：

- 清本地存储会影响工作流恢复
- 切换 conversation 时需要重新 hydrate workflow state
- 不能只盯数据库，以为所有状态都在那里

### 4. 自动化能力不是所有 runtime 都有

普通目标草稿生成默认支持。

但目标自动化依赖：

- 规划端口
- 工具执行端口
- 通常也意味着需要更完整的 remote ai-service runtime

所以如果前端“看不到自动化入口”，第一反应应该先查 capability，而不是先查按钮。

### 5. AI 模块负责“智能”，goal/task 模块负责“真实业务”

这条边界是当前设计的核心。

如果以后要加更多 AI 能力，优先沿着这条边界扩展：

- AI 负责提议、规划、解释、组装
- 领域模块负责校验、创建、修改、持久化

不要反过来让 AI 模块直接操作底层表结构。

## 新人建议的阅读顺序

如果你只想最快读懂，按这个顺序：

1. 看 `AIChatView.vue`，理解普通聊天壳和 goal workflow 是怎么共存的。
2. 看 `generateGoalDraftFromConversation()` 和 `handleCreateGoalFromDraft()`，理解“草稿”和“真实创建”的分界点。
3. 看 `GoalGenerationApplicationService`，理解 provider 解析和 planning port。
4. 看 `AIWorkspaceToolbox.vue` 的 `handlePlanAutomation()` / `handleExecuteAutomation()`，理解两段式确认。
5. 看 `AIGoalAutomationService`，理解 `approvedPlan` 复用和 `requiresConfirmation` 的判定。
6. 看 `BackendAutomationToolExecutorAdapter` 或 `DesktopAutomationToolExecutorAdapter`，理解最终怎么创建真实实体。
7. 最后再看 `CreateGoal` 和 task module 相关创建逻辑。

## 新人调试建议

如果你要断点调试，优先下在这些地方：

- `AIChatView.vue` 的 `generateGoalDraftFromConversation()`
- `AIChatView.vue` 的 `handleCreateGoalFromDraft()`
- `GoalGenerationApplicationService.generateGoal()`
- `AIGoalAutomationService.automateGoal()`
- `goal_planning_service.py` 的 `plan()` / `plan_automation()`
- `BackendAutomationToolExecutorAdapter.executeGoalAutomation()`
- `CreateGoal.execute()`

这样你能很快看清楚：

- 输入文本是什么
- AI 返回了什么
- 草稿是怎么映射成表单的
- 哪一步真正开始写业务数据

## 一句话记忆版

如果你只记一句：

**当前 AI 创建目标不是“模型直接建目标”，而是“模型先生成结构化草稿或动作计划，确认后再由 goal/task 模块创建真实实体”。**

## 相关文档

- [ai-chat-streaming-current-implementation.md](./ai-chat-streaming-current-implementation.md)
- [docs/getting-started/README.md](../../getting-started/README.md)
- [根 README](../../../README.md)
