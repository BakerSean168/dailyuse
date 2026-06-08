---
tags:
  - plan
  - active
  - ai
  - agent
  - architecture
  - roadmap
description: AI Agent 总体实施方案，收敛框架选型、运行时架构、前后端重构、工作台体验和完整 Goal Agent workflow
created: 2026-06-08T00:00:00
updated: 2026-06-08T00:00:00
---

# AI Agent 总体实施方案

## 1. 总结

本方案整合以下专项计划，作为后续 AI Agent 改造的主入口：

- `2026-06-04-ai-agent-framework-options.md`
- `2026-06-04-ai-agent-runtime-architecture-options.md`
- `2026-06-04-ai-agent-workspace-product-experience-plan.md`
- `2026-06-04-goal-agent-workflow-options.md`
- `2026-06-04-ai-agent-implementation-roadmap.md`

最终方向：

`AI Agent Workspace + LangGraph runtime + existing provider abstraction + Pydantic schemas + TS controlled business executors`

也就是说，Memoflow 不做一个任由模型自由调用工具的通用 ReAct agent，而是做一个面向个人目标与知识工作的受控 Agent 系统：

- 首页 `/` 改为 AI Agent Workspace。
- 前端以对话、上下文面板、结构化 artifact 和确认面板为核心。
- Python `ai-service` 引入 LangGraph，负责状态图、checkpoint、interrupt/resume 和事件流。
- Pydantic schema 继续作为结构化输出和 HTTP contract 的基础。
- `ChatService` / `LLMProvider` 继续作为业务侧 provider facade。
- `ToolRegistry` 继续作为工具权限、分类、确认和 executor 边界。
- Goal、Task、Reminder、Repository 等业务写入继续由 TS application layer 和业务模块执行。

第一阶段完成后，用户应能从首页直接通过自然语言创建目标、向个人知识库提问、把问答或对话沉淀为知识笔记；其中 Goal Agent 必须具备完整的澄清、草稿、计划、确认、执行和恢复链路。

## 2. 技术框架与边界

### 2.1 前端技术方案

使用现有前端栈，不引入新的 SPA 框架：

- Framework：Vue 3 + Vite。
- Monorepo / build：Nx + pnpm。
- UI：`@dailyuse/ui-vue-shadcn`、shadcn-vue 风格组件、Tailwind CSS、lucide-vue-next 图标。
- State/composable：继续以 `packages/app-vue/src/modules/ai/composables` 为 AI 工作台状态入口。
- Test：Vitest + Vue Test Utils；关键用户流用 Playwright e2e。

产品形态采用 Claude 式工作台，但保持个人管理软件的密度：

- 左侧：会话列表、最近 Agent run、最近目标、最近知识笔记。
- 中央：对话流和主输入框。
- 右侧：当前 Agent 的结构化上下文面板。
- 移动端：左侧会话和右侧上下文降级为抽屉或可展开面板。

路由调整：

- `/` 默认展示 AI Agent Workspace。
- `/ai/chat` 保留为同一工作台入口或重定向到 `/`。
- `/dashboard`、Goal、Task、Repository、Reminder 等传统模块保留，定位为 Agent 产物的管理、详情和复盘界面。

### 2.2 TS application layer 方案

`packages/ai` 和 `apps/api` 继续作为前端与 Python AI 服务之间的应用层边界：

- 负责 provider config resolution、identity context、conversation、execution log 和 capability 判断。
- 负责封装远程 `ai-service` 调用，前端不直接依赖 Python route 或 LangGraph 类型。
- 负责调用 Goal、Task、Reminder、Repository 等业务模块 executor。
- 继续支持 direct-provider fallback，但高级 Agent 能力依赖 remote `ai-service` runtime。

新增或收敛的应用层概念：

- `AgentRun`：一次 Agent 执行实例。
- `AgentEvent`：前端统一投影的运行事件。
- `AgentArtifact`：Goal draft、Knowledge answer、Knowledge note draft 等结构化产物。
- `AgentActionPlan`：待确认的 side-effect action plan。
- `AgentResumePayload`：用户确认、取消、编辑后恢复运行的 payload。

TS 层是业务写入边界。Python Agent 只能产出草稿、引用、计划和待执行动作，不能绕过 TS application layer 直接写业务数据库。

### 2.3 Python AI service 方案

`apps/ai-service` 保持 FastAPI + Pydantic 基础架构，引入 LangGraph 作为 workflow runtime：

- Web framework：FastAPI。
- Structured data：Pydantic v2。
- Runtime：LangGraph。
- Structured LLM call：第一阶段继续使用现有 Pydantic schema 和 provider；后续可在 graph node 内逐步引入 PydanticAI。
- Provider：继续保留 `ChatService` / `LLMProvider` / provider factory。
- Tool：继续保留并升级现有 `ToolRegistry`，需要时用 adapter 暴露给 LangGraph / LangChain tool abstraction。

推荐新增 Python package：

- `ai_service.agent_runtime`
- `ai_service.agent_runtime.graphs`
- `ai_service.agent_runtime.events`
- `ai_service.agent_runtime.checkpoints`
- `ai_service.agent_runtime.tools`

LangGraph 只承担运行时职责：

- 显式 graph 和 node 编排。
- checkpoint / resume。
- human-in-the-loop interrupt。
- event stream。
- state snapshot。
- node timing、tool call、token usage 等可观测数据。

LangGraph / LangChain 虽然有 chat model 和 tool 抽象，但在本项目里只作为运行时适配层；provider 配置、模型路由、工具权限、确认边界和业务写入仍以项目自有 abstraction 为准。

### 2.4 数据与持久化方案

分阶段实现：

- Phase 1：内存 checkpoint，只用于 LangGraph spike 和单测验证。
- Phase 2：持久化 `AgentRun` metadata、`AgentState` snapshot、pending interrupt、approved actions 和 execution result。
- Phase 3：将持久 checkpoint 接到正式 run history、刷新恢复、失败重试和 eval harness。

持久化实现建议：

- 短期先在 TS AI module 的 execution log / run state 表中封装项目自己的 port。
- LangGraph checkpointer 放在 Python runtime 内部，通过 adapter 使用项目 checkpoint port。
- 前端、TS contract 不暴露 LangGraph 原生类型。

## 3. 目标产品形态

### 3.1 首页成为 AI Agent Workspace

根路径 `/` 不再以传统欢迎页作为默认第一屏。

首页布局：

- 左栏展示会话、最近 Agent run、最近目标和最近知识笔记。
- 主区展示当前对话和 Agent 运行时间线。
- 右栏展示当前上下文，例如 Goal draft、action plan、citations、note draft。
- 底部输入框支持模型选择、意图选择、发送、停止。

空会话意图入口使用自然语言，不暴露技术模式：

- 创建目标。
- 问知识库。
- 整理知识。
- 规划今天行动。

### 3.2 Agent 结果必须结构化

Agent 输出不只是一段文本，而应尽量落到可确认、可编辑、可保存的 artifact：

- Goal draft。
- Key results。
- Task templates。
- Review cadence。
- Knowledge answer。
- Citations。
- Knowledge note draft。
- Pending actions。
- Execution timeline。

对话区负责解释、追问和总结；右侧上下文面板负责承载结构化产物和确认操作。

### 3.3 写入动作必须确认

所有 side-effect actions 必须走固定链路：

`自然语言意图 -> Agent 澄清 -> 结构化草稿 -> action plan -> 用户确认 -> TS executor 写入 -> 执行结果`

确认前必须展示：

- 将创建或更新什么对象。
- 对象属于哪个业务模块。
- 哪些内容来自用户输入。
- 哪些内容由 AI 补全。
- 用户可编辑、取消或重新生成的入口。

确认后执行的是用户批准的 artifact 和 action plan；不再让模型临场改写执行计划。

### 3.4 知识问答必须可信

Knowledge Agent 默认基于个人知识库回答，不能把普通聊天伪装成知识库问答。

必须展示：

- 答案正文。
- citations。
- 相关笔记。
- 打开来源入口。
- 证据不足提示。
- 沉淀为知识笔记入口。

当 citation 不足时，界面应明确展示“当前知识库证据不足”，而不是给出确定语气答案。

## 4. Agent Runtime 总体设计

### 4.1 核心对象

`AgentRun`：

- `run_id`
- `thread_id`
- `conversation_id`
- `identity_id`
- `agent_type`
- `status`
- `created_at`
- `updated_at`

`AgentState`：

- `messages`
- `intent`
- `stage`
- `artifacts`
- `citations`
- `retrieved_context`
- `pending_actions`
- `approved_actions`
- `executed_actions`
- `usage`
- `errors`

`AgentEvent`：

- `run.started`
- `node.started`
- `node.completed`
- `message.delta`
- `artifact.updated`
- `citation.selected`
- `tool.started`
- `tool.completed`
- `approval.required`
- `action.executed`
- `run.completed`
- `run.failed`

`AgentGraphRegistry` 第一阶段注册：

- `goal.create`
- `knowledge.qa`
- `knowledge.generate`

### 4.2 工具边界

工具分两类：

- read-only tool：允许 graph node 自动执行。
- side-effect tool：只能生成 pending action，等待用户确认后交给 TS executor。

第一阶段 read-only tools：

- `search_existing_goals`
- `search_knowledge`
- `fetch_goal_stats`
- `fetch_resource`
- `find_related_notes`

第一阶段 side-effect tools：

- `create_goal`
- `create_key_result`
- `create_task_template`
- `create_reminder`
- `create_knowledge_note`
- `update_knowledge_note`
- `reindex_resource`

禁止事项：

- 不把 side-effect tool 放进 LLM 自动 tool loop。
- 不让 Python runtime 直接写 Goal、Task、Reminder、Repository 数据。
- 不让前端直接构造业务写入 payload 绕过 TS application service。

### 4.3 API 迁移策略

迁移期间保留现有内部 workflow routes：

- `/internal/workflows/goal`
- `/internal/workflows/goal-automation`
- `/internal/workflows/knowledge`
- `/internal/workflows/knowledge-note`
- `/internal/workflows/knowledge-expand`
- `/internal/workflows/knowledge-index`

第一阶段不要求前端直接调用新的 Agent API。现有 route 内部可以逐步委托 `AgentRuntime`，response contract 保持兼容。

成熟后再新增统一 Agent API：

- `POST /internal/agents/runs`
- `POST /internal/agents/runs/{run_id}/resume`
- `GET /internal/agents/runs/{run_id}/events`

前端只通过 TS AI module 调用这些能力，不直接绑定 Python route。

## 5. 完整 Goal Agent Workflow

Goal Agent 是第一条完整落地链路，用来验证 workspace、graph、interrupt、confirmation、executor 和 recovery。

推荐 graph：

`intake -> retrieve_context -> clarify -> draft_goal -> validate_draft -> plan_actions -> approval_interrupt -> execute_actions -> result`

### 5.1 intake

职责：

- 接收用户最新输入、conversation transcript、意图按钮和 provider config。
- 判断是否进入 `goal.create`。
- 产出 `goal_intent`、`raw_idea`、`candidate_category`、`candidate_timeframe` 和 confidence。

如果输入只是普通聊天，不进入 Goal Agent。

### 5.2 retrieve_context

只读检索：

- 搜索已有目标，避免重复创建。
- 搜索相关知识笔记，补充目标背景。
- 读取近期 goal/task 统计，辅助可行性判断。

该节点只写入 `retrieved_context`，不做任何业务写入。

### 5.3 clarify

规则：

- 最多追问 2-4 个问题。
- 只问会影响目标结构的问题。
- 上下文足够时跳过澄清。

典型问题：

- 成功标准是什么。
- 期望期限是什么。
- 每周可投入多少时间。
- 更偏学习、产出、健康、财务还是项目交付。

### 5.4 draft_goal

产出 `GoalDraftArtifact`：

- goal title。
- description。
- category。
- importance。
- start date / target date。
- motivation。
- feasibility analysis。
- tags。
- 2-4 个 KR。
- task templates。
- review cadence。
- assumptions。

草稿是 artifact，不是真实业务实体。右侧 `GoalDraftPanel` 必须支持编辑。

### 5.5 validate_draft

检查：

- 目标是否过大或过虚。
- KR 是否可衡量。
- 时间范围是否合理。
- KR 权重是否合理。
- 任务模板是否支持 KR。
- 是否与已有目标冲突。

严重问题回到澄清或草稿修改；轻微问题进入 action plan，并在确认面板展示 warning。

### 5.6 plan_actions

产出 `AgentActionPlan` 和 `pending_actions`。

action 类型：

- `create_goal`
- `create_key_result`
- `create_task_template`
- `create_reminder`

每个 action 必须包含：

- `tool`
- `payload`
- `rationale`
- `index`
- `depends_on`

### 5.7 approval_interrupt

LangGraph 在此暂停。

前端确认面板展示：

- 将创建的目标。
- 将创建的 KR。
- 将创建的任务模板。
- 将创建的提醒或复盘节奏。
- AI 补全内容和用户原始输入。
- warning。
- 确认、取消、重新生成、编辑入口。

resume payload：

- `user_decision`
- `approved_actions`
- `edited_artifacts`
- `approved_plan`

取消后 run 标记为 `cancelled`。编辑后执行编辑后的 artifact。确认后不再次让模型修改计划。

### 5.8 execute_actions

执行边界：

- Python Agent Runtime 不直接写库。
- TS controlled executor 负责执行 approved actions。
- executor 调用 Goal、Task、Reminder 等业务模块。

失败策略：

- 目标创建失败：后续依赖 action 跳过，返回可重试状态。
- KR 创建失败：目标已创建则保留目标，失败 KR 进入 recovery。
- task/reminder 创建失败：不回滚目标和 KR，展示恢复建议。
- 支持用同一 approved plan 重试失败 action。

### 5.9 result

展示：

- 创建成功的目标入口。
- KR 和任务模板结果。
- 执行 timeline。
- 成功、失败、跳过状态。
- recovery 建议。
- 后续动作：打开目标、规划本周行动、创建复盘提醒、沉淀背景为知识笔记。

## 6. Knowledge Agent 范围

### 6.1 Knowledge Q&A

目标：

- 在统一工作台中提供“问知识库”意图。
- 复用现有 `QueryKnowledgeUseCase` 和 Python `KnowledgeQueryService`。
- 输出 `KnowledgeAnswerArtifact`，包含 answer、citations、related notes 和 evidence status。

验收：

- 有 citation 时能打开来源。
- citation 为空或不足时展示证据不足。
- 可从本次问答进入“沉淀为知识笔记”。

### 6.2 Knowledge Generation

目标：

- 从材料、对话或问答结果生成知识笔记草稿。
- 复用现有 `KnowledgeNoteService`。
- 确认前展示 title、path、tags、markdown、source 和 duplicate risk。
- 确认后通过 Repository module 保存，并触发 index 或标记待索引。

验收：

- 确认前不写 repository。
- 写入后返回 resource path。
- 索引成功、失败或待索引状态可见。

## 7. 实施路线

### Phase 1：Workspace 与 Agent contract

目标：

- 首页 `/` 改为 AI Agent Workspace。
- 定义 `AgentRun`、`AgentState`、`AgentEvent`、`AgentArtifact`、`AgentActionPlan` 的 TS/Python contract 草案。
- 将 `WorkflowMode` 从技术模式调整为用户意图：`chat`、`goal-create`、`knowledge-qa`、`knowledge-generate`。
- 统一右侧 context panel，承载 Goal 和 Knowledge artifact。

验收：

- `/` 展示工作台。
- 空会话展示主输入框和意图按钮。
- `/ai/chat` 仍可进入同一体验。
- 不改后端 runtime 时，现有 chat、goal draft、knowledge note 主流程仍可用。

### Phase 2：LangGraph runtime spike

目标：

- 在 Python `ai-service` 新增实验性 `agent_runtime`。
- 用 memory checkpointer 实现最小 `goal.create` graph。
- 验证 interrupt/resume 和 `AgentEvent` 输出。

验收：

- graph 可暂停在 approval 节点。
- 使用同一 thread id 可 resume。
- mock side-effect action 不会在确认前执行。
- 单测可验证 state snapshot。

### Phase 3：Goal Agent 接入真实 workflow

目标：

- 统一当前 goal draft 和 goal automation。
- Graph node 调用现有 `GoalPlanningService`。
- `plan_actions` 产出 pending actions。
- `approval_interrupt` 返回前端确认 payload。
- `execute_actions` 委托 TS controlled executor。

验收：

- 一句话可进入 Goal Agent。
- 信息不足时追问。
- 右侧可编辑 goal/KR/task。
- 确认前不创建业务对象。
- 确认后创建目标、KR、任务模板和复盘提醒。
- 执行结果展示 timeline 和 recovery。

### Phase 4：Knowledge Q&A artifact 化

目标：

- 启用 `knowledge-qa` 意图。
- `AIChatService` 接入 `queryKnowledge`。
- 将结果保存为 `KnowledgeAnswerArtifact`，而不只是一条 assistant message。
- 右侧展示 citations、related notes 和 index status。

验收：

- 知识问答有 citations。
- citation 可打开来源。
- 证据不足时有专门 empty state。
- 可进入“沉淀为知识笔记”流程。

### Phase 5：Knowledge Generation Agent

目标：

- 新增 `knowledge.generate` graph。
- 支持从问答、当前对话和用户材料生成知识笔记草稿。
- 确认后通过 Repository module 保存。
- 保存后触发 index 或显示待索引。

验收：

- 可从问答生成笔记草稿。
- 可从当前对话生成笔记草稿。
- 确认前不写 repository。
- 写入后返回 resource path 和 index 状态。

### Phase 6：Durability、observability 与 eval

目标：

- 引入持久 checkpoint。
- 保存 run history、pending interrupt、approved actions 和 execution result。
- 记录 node timing、tool calls、token usage。
- 增加 Goal 和 Knowledge eval harness。
- 前端刷新后恢复 active run。

验收：

- 刷新后能恢复 Goal Agent 草稿/确认状态。
- 失败 action 可重试。
- 每次 run 可追踪 token usage 和节点耗时。
- eval 能捕获 goal draft 质量和 knowledge grounding 回归。

## 8. 验证计划

Python：

- `apps/ai-service/tests/unit/test_agent_runtime.py`
- `apps/ai-service/tests/unit/test_goal_agent_graph.py`
- `apps/ai-service/tests/unit/test_knowledge_qa_graph.py`
- `apps/ai-service/tests/unit/test_knowledge_generation_graph.py`
- 现有 workflow route 兼容性测试继续保留。

TS application layer：

- `packages/ai` agent contract tests。
- remote ai-service runtime capability tests。
- goal prepare/execute contract tests。
- knowledge query artifact tests。
- controlled executor tests，覆盖确认前不执行和 partial failure。

Frontend：

- `AIChatView.spec.ts` 更新为 Agent Workspace 行为。
- context panel tests。
- Goal draft / action plan / approval panel tests。
- Knowledge citation panel tests。
- mobile responsive smoke tests。

E2E：

- `/` loads Agent Workspace。
- create goal from natural language。
- confirm 后创建 goal/KR/task/reminder。
- ask personal knowledge base with citations。
- save Q&A as knowledge note。
- refresh 后恢复 pending approval run。

文档改动至少运行：

- `pnpm nx run daily-use:governance-check`

代码改动按影响范围补充：

- `pnpm nx run app-vue:lint`
- `pnpm nx run app-vue:typecheck`
- `pnpm nx run ai:test`
- `pnpm nx run web:e2e`
- `apps/ai-service` 对应 pytest / pyright / ruff target。

## 9. 明确不做

第一阶段不做：

- 不做完全自主多 Agent 编排。
- 不做模型自由写数据库。
- 不把 side-effect tools 放进自动 LLM tool loop。
- 不迁移到 Pi 作为主 runtime。
- 不以 OpenAI Agents SDK 作为主 runtime。
- 不大规模重做所有传统业务模块页面。
- 不让前端直接依赖 LangGraph 类型。
- 不在没有 citations 的情况下展示确定的知识库回答。

## 10. 完成定义

本总方案第一阶段完成定义：

- `/` 是 AI Agent Workspace。
- Goal Agent 支持完整 `intake -> retrieve_context -> clarify -> draft_goal -> validate_draft -> plan_actions -> approval_interrupt -> execute_actions -> result`。
- Goal Agent 所有写入都必须经过确认。
- Knowledge Q&A 支持 citation artifact 和证据不足提示。
- Knowledge Generation 支持从问答或对话生成知识笔记草稿，并确认后保存。
- Python `ai-service` 内有可测试的 LangGraph runtime spike，并逐步接管 Goal Agent。
- TS application layer 仍是 provider resolution、capability、conversation、execution log 和业务写入边界。
- 前端右侧 context panel 能展示 goal draft、action plan、execution timeline、citations 和 note draft。
- 有覆盖 runtime、application layer、frontend 和 e2e 的最小测试集。

