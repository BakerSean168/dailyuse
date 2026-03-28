# AI 工作流如何融入现有操作流

本文说明当前仓库里类似“AI 对话 -> 生成目标草稿 -> 编辑 -> 创建目标”以及“AI 对话 -> 生成知识笔记 -> 保存”的实现方式，重点回答这几个问题：

1. 当前这些工作流是不是直接靠 `AIService` 就能跑起来
2. AI 是怎么生成“符合表单要求的数据格式”的
3. AI 生成的数据是怎么被自动填入现有编辑表单的
4. 这是否只是提示词工程
5. 如果切到 Python `ai-service`，和现在有什么区别
6. `ai-service` 是否已经实现了同类工作流

---

## 1. 当前工作流的总体结论

结论先说：

- 当前 AI Chat 页面上的这些工作流，已经可以直接依赖现有 `AIService` 跑起来
- 但这里的 `AIService` 指的是前端注入的统一 AI 业务入口，不等于一定会走远端 Python `ai-service`
- 当前实现本质上是“AI 负责生成草稿/内容，业务模块负责持久化和真实创建”
- 其中“结构化输出”不是只靠提示词，而是“提示词约束 + JSON 输出 + 解析/校验 + UI 映射”的组合

换句话说，现在这套能力不是单纯的聊天增强，而是：

- AI 负责把自然语言意图转换成结构化草稿
- 前端把草稿映射成现有业务表单状态
- 业务模块仍然调用原本的 `goal`、`repository` 等正式创建接口落库

这是一种很典型的“AI workflow as orchestration layer”模式，而不是“让 AI 直接替代业务系统”。

---

## 2. 当前链路里 `AIService` 到底做了什么

### 2.1 前端调用的确实是统一 `AIService`

AI Chat 页面里这几条关键路径都通过注入的 `service` 调用：

- `createConversation`
- `listMessages`
- `streamMessage`
- `generateGoal`
- `createKnowledgeNote`

对应文件：

- `packages/app-vue/src/modules/ai/views/AIChatView.vue`

这个 `service` 不是页面内联实现，而是由 Vue DI 注入的 `AIClientService`：

- `packages/app-vue/src/di/keys.ts`
- `apps/desktop/src/renderer/platform/di.ts`
- `packages/ai/src/application-client/ai-client-service.ts`

在 desktop renderer 里，`AI_SERVICE_KEY` 实际绑定的是：

- `createAIIpcAdapters(...)`
- `new AIClientService(...)`

所以从页面视角看，AI Chat 的所有工作流都已经是“通过统一 AI 模块”在跑，而不是散落在页面里的临时逻辑。

### 2.2 但不一定走远端 Python `ai-service`

桌面主进程组装 AI 模块时，会根据环境变量决定执行端：

- 如果配置了 `AI_SERVICE_BASE_URL` 和 `AI_SERVICE_SECRET`
  - 会装配 `AIServiceChatExecutionAdapter`
  - `AIServiceGoalPlanningAdapter`
  - `AIServiceKnowledgeNoteGenerationAdapter`
  - 等远端 adapter
- 如果没配
  - 会退回 direct-provider adapter

对应文件：

- `packages/ai/src/shared/config/env.ts`
- `packages/ai/src/electron-entry/index.ts`
- `packages/ai/src/infrastructure-server/ai.module.ts`

所以当前你看到的 AI workflow 是“统一 AI 业务接口”已经接好了，但底层执行模式可能是两种之一：

- `direct-provider`
- `remote-ai-service`

这两个模式对上层页面是透明的。

---

## 3. 以“创建 Goal”工作流为例，完整链路是什么

当前 goal 工作流的核心不是“让 AI 直接帮你创建目标”，而是分成两段：

1. 先让 AI 产出一个结构化 goal draft
2. 再把这个 draft 映射进现有 Goal 编辑状态，最后仍调用正式 Goal 创建接口

### 3.1 页面如何发起 goal draft 生成

在 AI Chat 页面里，点击“生成目标草稿”后会调用：

- `service.generateGoal(...)`

发送的数据主要是：

- `idea`: 对话 transcript
- `includeKeyResults`
- `providerId`
- `model`

对应文件：

- `packages/app-vue/src/modules/ai/views/AIChatView.vue`

### 3.2 应用服务如何组装执行请求

服务端进入：

- `packages/ai/src/application-server/use-cases/commands/goal-generation-application-service.ts`

这里会做几件事：

1. 解析当前要使用的 provider 配置
2. 把页面选中的 `model` 覆盖到执行配置里
3. 调用抽象端口 `IGoalPlanningPort.plan(...)`
4. 记录 execution log
5. 返回结构化的 `goal + keyResults`

这一步很关键，因为它说明：

- 前端并不是直接把 prompt 拼完发给 provider
- 页面也不直接知道底层是 direct-provider 还是 ai-service
- 页面只负责传“意图 + 选中的模型”，真正的执行策略由应用服务和端口实现决定

### 3.3 Goal draft 是怎么变成可编辑表单状态的

AI 返回结果后，页面会执行：

- `applyGoalDraft(...)`

对应文件：

- `packages/app-vue/src/modules/ai/views/AIChatView.vue`

这一步会把 AI 返回的结构化数据映射成两份前端状态：

- `editableGoal`
- `editableKeyResults`

例如：

- `goal.title / goal.name` -> `editableGoal.name`
- `goal.description` -> `editableGoal.description`
- `goal.suggestedStartDate` -> `editableGoal.startDate`
- `goal.suggestedEndDate` -> `editableGoal.targetDate`
- `keyResults[]` -> `editableKeyResults[]`

其中 KR 还会被映射成现有业务表单真正需要的字段：

- `valueType`
- `calculationMethod`
- `startValue`
- `currentValue`
- `targetValue`
- `unit`
- `weight`

这就是“自动提取关键信息添加到编辑表格中”的真实实现方式。

它不是页面再从自然语言里做二次 NLP 提取，而是：

- 后端先让模型输出结构化 JSON
- 前端再把 JSON 映射进表单状态

### 3.4 最终创建仍然走正式 Goal 接口

用户确认后，不是 AI 模块自己偷偷落库，而是页面继续调用正式业务接口：

- `createGoal(...)`
- 然后逐个 `addKeyResult(...)`

对应文件：

- `packages/app-vue/src/modules/ai/views/AIChatView.vue`

这一步非常重要，因为它让 AI 工作流和原本 Goal 模块保持了一致的数据入口和业务约束。

也就是说：

- AI 负责“起草”
- Goal 模块负责“正式创建”

这是一种比“让 AI 直接写数据库”更稳的设计。

---

## 4. Goal draft 到底怎么保证“格式正确”

这部分不是单纯提示词工程，而是四层机制叠加。

### 4.1 第 1 层：系统提示词规定 JSON 合同

direct-provider goal planning adapter 在调用模型时，系统提示词会明确要求：

- 只返回 JSON
- 不要 markdown code fence
- 目标和 KR 必须符合给定 shape
- 如果用户给了当前进度，要保留到 `startValue` / `currentValue`
- KR 的 `valueType`、`calculationMethod`、`weight` 要满足规则

对应文件：

- `packages/ai/src/infrastructure-server/chat-execution/direct-provider-goal-planning.adapter.ts`
- `packages/ai/src/infrastructure-server/chat-execution/goal-planning-response.ts`

这就是提示词工程的部分。

### 4.2 第 2 层：要求模型输出结构化 JSON，而不是自由文本

当前 direct-provider adapter 不是让模型返回一段自然语言计划，再从里面抽字段，而是直接要求：

```json
{
  "goal": { ... },
  "keyResults": [ ... ]
}
```

并且把 response format 设成 JSON。

这一步让模型从一开始就输出“机器可消费”的内容，而不是“人可读但机器难用”的内容。

### 4.3 第 3 层：代码解析和默认值收敛

即使模型输出 JSON，也不代表字段一定完全可靠。所以还会经过：

- `stripCodeFence`
- `safeParseJson`
- `toGoalCategory`
- `toImportanceLevel`
- `toValueType`
- `toCalculationMethod`
- 数字/时间转换
- 默认值补全

对应文件：

- `packages/ai/src/infrastructure-server/chat-execution/goal-planning-response.ts`

这里做的事情包括：

- 把字符串日期转成时间戳
- 如果没有 `suggestedEndDate`，按 `suggestedDurationDays` 或默认 30 天推导
- 如果没有 `currentValue`，回退到 `startValue`
- 如果 KR 不合法，给合理默认值

所以当前结构化目标草稿的可靠性，实际上来自：

- Prompt contract
- 结构化输出
- 确定性解析
- 默认值策略

而不是只靠一句“请按 JSON 返回”。

### 4.4 第 4 层：前端再次映射到正式业务字段

AI 返回的是 `GenerateGoalResultDTO` 里的 goal draft 结构：

- `packages/contracts/src/modules/ai/dtos/goal-generation-result.dto.ts`

这仍然不是最终 Goal 模块的落库格式。页面还会把它再映射到 Goal 模块真正的创建数据结构里。

所以整个链路其实有两次结构化：

1. 模型输出 AI draft DTO
2. 页面把 AI draft DTO 映射成 Goal 模块表单/创建结构

---

## 5. 这算不算“单纯的提示词工程”

不算。

更准确地说，这是：

- 提示词工程
- 结构化输出契约
- 后处理解析
- UI 状态映射
- 业务接口编排

的组合。

如果只有提示词工程，会是这种模式：

- 给模型一句 prompt
- 直接把文本展示给用户

而现在这套工作流已经远远不止这个层级。

当前系统的关键特征是：

- AI 只负责生成草稿
- 草稿必须进入结构化数据
- 结构化数据再进入现有业务表单
- 最终仍通过原有业务模块创建

这是一种“AI 增强业务流程”的实现，不是“聊天机器人顺手调用几个接口”那么简单。

---

## 6. 知识笔记工作流和 Goal 工作流有什么不同

知识笔记工作流更轻。

当前链路：

1. 页面调用 `service.createKnowledgeNote(...)`
2. `AIKnowledgeNoteService` 选择 provider 和 model
3. 调用 `IKnowledgeNoteGenerationPort.generate(...)`
4. 生成 Markdown 文本
5. 再调用 persistence port 保存成真正的知识笔记资源

对应文件：

- `packages/ai/src/application-server/use-cases/commands/ai-knowledge-note.service.ts`
- `packages/ai/src/infrastructure-server/chat-execution/direct-provider-knowledge-note-generation.adapter.ts`

和 Goal 的区别在于：

- Goal 生成的是结构化 draft，需要映射进编辑器
- 知识笔记生成的是 Markdown 内容，然后直接持久化

所以知识笔记工作流更多是：

- prompt -> markdown text -> save file

而 Goal 工作流更多是：

- prompt -> structured JSON -> editable draft -> business create

---

## 7. 如果切到 Python `ai-service`，区别在哪里

### 7.1 对上层页面，几乎没有区别

页面仍然调用：

- `service.generateGoal(...)`
- `service.createKnowledgeNote(...)`
- `service.streamMessage(...)`

上层页面和大部分应用服务不需要改。

这是因为 TypeScript 侧已经把 AI 能力抽象成了端口：

- `IGoalPlanningPort`
- `IKnowledgeNoteGenerationPort`
- `IAIChatExecutionPort`

当你切换到底层 adapter 时，上层 orchestration 不变。

### 7.2 对执行端，有实质区别

#### 当前 direct-provider 模式

TypeScript 端直接：

- 组装 prompt
- 调 gateway
- 解析返回

例如 goal planning：

- `DirectProviderGoalPlanningAdapter`

知识笔记：

- `DirectProviderKnowledgeNoteGenerationAdapter`

#### remote ai-service 模式

TypeScript 端变成：

- 把输入和 provider config 发给 Python `ai-service`
- Python 负责调用模型
- Python 返回结构化结果或文本

例如：

- `packages/ai/src/infrastructure-server/chat-execution/ai-service-goal-planning.adapter.ts`

这个 adapter 调的是：

- `POST /internal/goals/plan`

而知识笔记走的是：

- `POST /internal/knowledge/generate-note`

### 7.3 真正的变化不是“有没有工作流”，而是谁执行 AI 推理逻辑

当前 direct-provider：

- TS 负责 prompt 和解析

切到 ai-service：

- Python 负责 prompt 和解析
- TS 负责业务编排和持久化

所以变化的核心不是 UI 工作流变了，而是“LLM orchestration 逻辑迁到 Python 服务里了”。

---

## 8. `ai-service` 是否已经实现了同样的工作流

结论是：已经实现了“同类 AI 生成能力”，但不完全等于“已经完整接管当前前端工作流的全部业务动作”。

### 8.1 已实现的能力

`apps/ai-service` 目前已经有这些内部接口：

- `/internal/chat/complete`
- `/internal/chat/stream`
- `/internal/goals/plan`
- `/internal/goals/plan-actions`
- `/internal/knowledge/generate-note`
- `/internal/knowledge/index-resource`
- `/internal/knowledge/query`
- `/internal/knowledge/expand`
- `/internal/analytics/query`

对应文件：

- `apps/ai-service/src/ai_service/app.py`
- `apps/ai-service/src/ai_service/api/routes/chat.py`
- `apps/ai-service/src/ai_service/api/routes/goals.py`
- `apps/ai-service/src/ai_service/api/routes/knowledge.py`

其中：

- `GoalPlanningService` 已经会通过 prompt 生成结构化 goal plan
- `KnowledgeNoteService` 已经会生成 Markdown note

### 8.2 但当前前端“编辑后创建 Goal”这类最终业务动作，仍然主要在 TypeScript 层完成

当前 AI Chat 页面里：

- 生成 goal draft 是 AI 模块做的
- 最终调用 `createGoal`、`addKeyResult` 仍然是前端 + Goal 模块在做

也就是说，当前完整工作流的职责分布是：

- AI 模块 / ai-service：负责“生成”
- Goal 模块 / Repository 模块：负责“正式创建”
- AI Chat 页面：负责“把两者编排起来”

### 8.3 `plan-actions` 更接近“让 AI 直接规划业务动作”

Python `ai-service` 里还有：

- `/internal/goals/plan-actions`

这条能力更接近：

- 让 AI 不只生成 goal draft
- 还显式返回 tool calls / action plan

这可以视为“更自动化的 workflow planning”能力。

但从当前 AI Chat 页面实现看，还没有把这条能力接成你现在使用的主流程。当前页面主路径还是：

- `generateGoal`
- 然后本地编辑
- 然后正式 `createGoal`

所以可以说：

- `ai-service` 已经具备更高级 workflow planning 的接口
- 但当前前端主要接的是 goal draft / note generation 这一层

---

## 9. 为什么这种架构适合把 AI 融入原有操作流

这种做法的优点非常明确。

### 9.1 保留原有业务模块的权威入口

最终创建 Goal、KR、知识资源时，仍然走原有模块的正式接口。

这意味着：

- 原有校验可以继续生效
- 原有事件总线、审计、统计可以继续生效
- AI 不需要直接知道数据库结构

### 9.2 AI 只负责最不稳定的“理解意图和起草”

真正适合交给大模型的部分是：

- 理解自然语言意图
- 从模糊描述中提炼结构
- 补全草稿

不适合完全交给大模型的部分是：

- 最终数据写入
- 业务一致性
- 事务和副作用控制

当前实现刚好把这两者分开了。

### 9.3 前端工作流可以逐步演进

你现在已经有：

- 普通聊天
- 生成目标草稿
- 生成知识笔记

后面如果要做：

- AI 自动生成 task templates
- AI 调用 `plan-actions`
- AI 辅助创建 reminder / repository resource

也可以继续沿用同一个模式：

- AI 先生成结构化意图
- UI 允许确认和修订
- 业务模块负责正式执行

---

## 10. 当前这套实现的边界和建议

### 10.1 当前已经做得比较对的地方

- AI 和业务模块的边界清晰
- provider/model 已进入正式执行配置，而不是写死
- goal draft 已经不是纯文本，而是结构化数据
- knowledge note 已经有明确的 persistence port
- direct-provider 和 ai-service 两套执行策略被抽象成统一端口

### 10.2 当前仍然值得继续加强的点

1. AI Chat 页面缺少 capability / runtimeMode 可见性  
   页面本身现在看不出当前到底是 `direct-provider` 还是 `remote-ai-service`

2. 工作流日志不足  
   前端和 IPC adapter 目前基本静默，调试体验弱

3. structured draft 和正式表单仍有少量重复映射  
   长期看可以继续把 Goal 编辑表单抽成更可复用的共享内容组件

4. `plan-actions` 还没有真正成为前端主 workflow  
   目前更多还是“AI 起草 + 业务创建”，还不是“AI 规划动作 + 用户确认执行”

---

## 11. 一句话总结

当前仓库里的 AI 工作流已经不是“聊天框里加一个 prompt”这么简单了。

它本质上是：

- 用统一 `AIService` 接入 AI 能力
- 用结构化输出把自然语言意图转换成 draft
- 用前端状态映射把 draft 嵌入现有业务表单
- 用原有业务模块完成最终创建
- 并允许底层执行端在 `direct-provider` 和 `remote-ai-service` 之间切换

如果要继续往下做更强的 AI workflow，最自然的方向不是让 AI 直接替代业务模块，而是继续强化这条链路：

- 更强的结构化输出
- 更明确的 action planning
- 更好的确认机制
- 更完整的日志与可观测性

