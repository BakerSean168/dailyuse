---
tags:
  - plan
  - active
  - ai
  - agent
  - architecture
description: AI Agent 框架选型方案，比较自研 orchestrator、LangGraph、PydanticAI、Pi 与 OpenAI Agents SDK
created: 2026-06-04T00:00:00
updated: 2026-06-04T00:00:00
---

# AI Agent 框架选型方案

## 1. 结论

推荐路线：

`LangGraph-style explicit workflow + existing provider abstraction + Pydantic schemas + controlled business executors`

也就是说，第一阶段不要把系统改成一个通用 ReAct agent，也不要把业务写入交给模型自由调用。当前 Python `ai-service` 里的 provider、schema、workflow handler、goal/knowledge service 都有可复用价值；真正缺的是更优雅的 agent runtime 能力：

- 显式状态图。
- checkpoint / resume。
- human-in-the-loop interrupt。
- 统一事件流。
- read-only tool 与 side-effect tool 的权限边界。
- 可观测的 run state 和 execution timeline。

LangGraph 最适合作为这个 runtime 的优先验证对象。PydanticAI 更适合作为节点内部的 typed agent / structured output 层。Pi 更适合作为产品体验和 session/event 设计参考，不建议作为当前 Python 服务的核心 runtime。

## 2. 现状判断

当前 `apps/ai-service` 已经有基础 agent 雏形：

- `AIWorkflowOrchestrator` 负责根据 workflow type 分发 handler。
- `GoalWorkflowHandler`、`KnowledgeWorkflowHandler`、`KnowledgeNoteWorkflowHandler` 等已经按领域拆分。
- `provider_tool_runtime.py` 已经有 provider-native tool loop。
- Pydantic schemas 已经承载 goal、knowledge、chat 的结构化 request/response。
- TS application layer 已经通过 port/use-case 隔离 Python AI 服务与业务模块。

当前问题不是“没有 agent”，而是 agent runtime 还太薄：

- workflow state 不够统一。
- 节点之间没有标准事件。
- 缺少 durable checkpoint。
- 需要用户确认时没有通用 interrupt/resume 模型。
- 缺少统一 run id/thread id。
- 前端难以展示每个节点进度、引用、草稿、待确认动作。

## 3. 方案 A：继续强化自研 Orchestrator

做法：

- 保留当前 `AIWorkflowOrchestrator`。
- 增加 `AgentRunState`、`AgentEvent`、`AgentCheckpointStore`。
- 每个 handler 内部手写状态机。
- 自己实现 interrupt/resume 和事件流。

优点：

- 依赖最少。
- 改动路径最短。
- 完全符合现有架构。
- 不引入外部框架学习成本。

缺点：

- checkpoint、resume、time travel、event streaming 都要自己维护。
- 多 workflow 的状态机容易继续分散。
- 后续 Goal Agent、Knowledge Agent、Analytics Agent 增长后，运行时复杂度会转嫁到业务 service。

适用场景：

- 只做短期 UI 强化。
- 目标是 1-2 周内把当前功能做顺，不打算上长期 agent runtime。

不推荐作为最终路线，但可以作为 Phase 1 的过渡层。

## 4. 方案 B：LangGraph 作为 Workflow Runtime

做法：

- 在 Python `ai-service` 内引入 LangGraph。
- 每个核心能力定义为显式 graph：
  - `goal.create`
  - `knowledge.generate`
  - `knowledge.qa`
- graph node 调用现有 service、provider、tool executor。
- 使用 checkpointer 保存 graph state。
- 使用 interrupt 承载用户确认。
- 使用 event stream 给前端展示节点进度。

优点：

- LangGraph 定位就是 long-running、stateful agent orchestration。
- 官方能力覆盖 persistence、fault tolerance、streaming、human-in-the-loop、memory。
- interrupt 机制天然匹配“计划生成后暂停，用户确认后继续执行”。
- 不要求使用 LangChain agent abstraction；可以保留当前 provider abstraction。
- 状态图比通用 agent loop 更适合当前业务：Goal 和 Knowledge 都是阶段明确的 workflow。

缺点：

- 新增 Python 依赖和学习成本。
- 需要设计稳定的 `AgentState`，不能把现有 response 直接塞进 graph。
- 如果一次性迁移所有 workflow，风险较高。

推荐程度：高。

默认使用方式：

- 先做 spike，不直接全量替换。
- 第一条落地选择 Goal Agent，因为它最需要 confirmation interrupt。
- Knowledge Q&A 第二条落地，因为它能验证 event/citation/result artifact。
- 保留 `/internal/workflows/*` 兼容入口，新 agent runtime 先作为内部实现替换。

## 5. 方案 C：PydanticAI 作为 Typed Agent 层

做法：

- 在 graph node 内部用 PydanticAI agent 生成结构化输出。
- `GoalDraftOutput`、`GoalPlanOutput`、`KnowledgeAnswerOutput` 等继续用 Pydantic model 约束。
- function tools 只暴露 read-only 能力；side-effect tool 不直接给模型执行。

优点：

- 与当前 Python Pydantic schemas 非常贴合。
- 强化 structured output、tool 参数校验和 retry。
- 类型体验更好，适合 pyright/mypy。
- 可独立用于某些节点，不强迫整个系统迁移。

缺点：

- 它更像 agent abstraction，不是完整业务 workflow runtime。
- durable execution / checkpoint / human approval 仍需要额外承载。
- 如果直接让 PydanticAI 管整个业务流程，Goal/Knowledge 的阶段状态仍需另行设计。

推荐程度：中高。

推荐定位：

- 不作为主 orchestrator。
- 作为 LangGraph 节点内部的 typed LLM call / structured output 层。
- 替换当前部分手写 prompt parsing 时优先考虑。

## 6. 方案 D：Pi 作为主 Agent Runtime

做法：

- 引入 `earendil-works/pi` 生态，把 agent session、tool、event、UI library 作为主运行时。
- 将当前 Python `ai-service` 改造成 Pi agent 的后端工具或外部服务。

优点：

- Pi 的产品形态很接近 agent 原生应用。
- session、event、tool execution、TUI/Web UI 的设计值得参考。
- TypeScript 生态与当前前端/Node application layer 更接近。

缺点：

- 当前项目核心 AI runtime 在 Python `ai-service`，迁到 Pi 会产生语言和边界重构。
- Pi 更偏 coding agent toolkit，而 MemoFlow 的核心是个人目标和知识工作台。
- Pi 的 SDK/session 模型可借鉴，但并不天然解决业务 write boundary、goal workflow、repository indexing。
- 作为主 runtime 会让当前 provider abstraction、Python service、TS port 关系变复杂。

推荐程度：低。

推荐定位：

- 只参考它的 session/event/state/UI 思路。
- 不作为当前核心 runtime。

## 7. 方案 E：OpenAI Agents SDK

做法：

- 使用 OpenAI Agents SDK 定义 agent、tool、handoff、guardrail、trace。
- 优先围绕 OpenAI provider 构建 agent workflows。

优点：

- Agents、handoffs、guardrails、tracing 能力完整。
- 如果产品强绑定 OpenAI 模型，集成路径较清晰。

缺点：

- 当前项目需要 OpenAI、Anthropic、OpenAI-compatible 等多 provider。
- 现有 `ProviderConfig` 和 provider abstraction 已经是项目资产。
- OpenAI-first 会削弱模型供应商中立性。

推荐程度：中低。

推荐定位：

- 作为 OpenAI provider 的高级 adapter 候选。
- 暂不作为主 agent runtime。

## 8. 推荐组合

最终推荐组合：

- Workflow runtime：LangGraph。
- Structured output：继续使用 Pydantic schemas；可逐步引入 PydanticAI。
- Provider abstraction：保留当前 `ChatService` / `LLMProvider` 作为业务侧 provider facade；LangGraph 节点内部只通过 adapter 调用它，不直接取代现有 provider 配置与模型路由。
- Tool boundary：保留并升级现有 `ToolRegistry` 作为工具权限、分类、确认和业务 executor 边界；LangGraph / LangChain 的 tool 抽象只作为运行时适配层。
- Business writes：继续由 TS application layer 和业务模块 executor 负责。
- UI inspiration：参考 Pi / Claude 类 agent session 体验。

补充说明：

- LangGraph / LangChain 体系本身包含 chat model、tool calling、`ToolNode` 等通用抽象，但这些抽象主要服务 agent runtime 内部执行。
- 当前项目的 provider abstraction 承载用户配置、默认模型、OpenAI / Anthropic / OpenAI-compatible 兼容、错误归一和后续成本/审计策略，不应被 runtime 细节替代。
- 当前项目的 `ToolRegistry` 承载产品级权限边界：哪些 tool 可读、哪些 action 有副作用、哪些必须等待用户确认、哪些只能由 TS application layer 执行写入。
- 因此推荐做法不是把工具和 provider 全量迁入 LangGraph，而是在 LangGraph node 与现有 provider/tool 层之间增加薄 adapter。

核心原则：

- Agent runtime 只负责状态、节点编排、工具调用适配、暂停恢复和事件。
- 业务模块仍是数据真值。
- 模型不能直接写数据库。
- 所有 side-effect actions 必须先形成 plan，再由用户确认。

## 9. 验收标准

- 选型文档能解释为什么不是简单替换成 LangChain Agent。
- 选型文档能解释为什么 Pi 不适合作为当前主 runtime。
- 推荐方案能保留现有 Python/TS 分层和 provider abstraction。
- 推荐方案能支撑 Goal Agent 的确认后执行。
- 推荐方案能支撑 Knowledge Q&A 的引用答案和证据不足提示。

## 10. 参考资料

- LangGraph overview: https://docs.langchain.com/oss/python/langgraph/overview
- LangGraph persistence: https://docs.langchain.com/oss/python/langgraph/persistence
- LangGraph interrupts: https://docs.langchain.com/oss/python/langgraph/interrupts
- PydanticAI agents: https://pydantic.dev/docs/ai/core-concepts/agent/
- PydanticAI structured output: https://pydantic.dev/docs/ai/core-concepts/output/
- Pi repository: https://github.com/earendil-works/pi
- Pi SDK docs: https://pi.dev/docs/latest/sdk
- OpenAI Agents SDK: https://openai.github.io/openai-agents-python/
