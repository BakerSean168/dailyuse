---
tags:
  - product
  - module
  - ai
description: AI 模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-07-22T00:00:00
---

# AI 模块说明

## 1. 功能定位

AI 模块用于用 AI 辅助用户整理上下文并生成结构化行动。它围绕统一助手、右侧业务工作台、目标生成、知识笔记、模型选择和 workflow persistence 形成闭环，是 AI 能力的统一入口。AI 模块产出结构化中间态，真实业务写入仍由业务模块（goal、task、repository）完成。

## 2. 当前功能说明

- AI Chat：用户与 AI 进行对话，支持消息发送和流式响应。
- 目标生成：通过 goal workflow 生成结构化目标草稿，支持澄清、编辑和确认后写入目标模块。
- 目标自动化：AI 可生成任务模板并绑定到目标，支持自动化 tool execution。
- 知识笔记：ADR-034 已落地——Desktop 本地 Vault 确认写入；绑定 GitHub 后 Web 仅 confirmed-create 新笔记（Git commit），不开放已有笔记全文编辑；旧数据库 Repository 笔记 CRUD 运行时已摘除。
- 知识查询：基于向量索引的知识检索和问答。
- 知识扩展：对已有知识进行扩展和深化。
- 知识索引：自动同步和索引 repository 中的资源内容。
- 模型选择：用户可配置多个 AI provider（OpenAI、Anthropic 等），选择默认模型。
- Provider 管理：创建、更新、删除、测试连接和刷新模型列表。
- 分析查询：AI 可查询目标、任务和 Dashboard 的分析数据。
- 评估报告：离线评估 harness 用于评估 goal workflow 质量。
- 会话管理：创建、删除、列出对话，支持对话状态管理。
- 双运行时模式：支持直连 LLM provider 和远程 ai-service 两种运行时。

已采纳且部分落地的目标态：统一助手通过 Daily Use Agent Host 组合 Workflow Engine、Turn Engine 和 Model Gateway；右侧业务面板统一展示 Artifact、Proposal、审批和执行结果。
当前仍保留 direct-provider / remote-ai-service 双运行时装配，但 ADR-035 Host 生产适配已部分接线：
`DirectTurnEngine`（开放式 chat）、`ReadonlyAnalysisTurnEngine`（readonly analysis /
`engine.pi_readonly`，经 Model Gateway）、`LangGraphWorkflowAdapter`（remote workflow）、
`ProposalKernel`（提案生命周期）、`CapabilityResolver`（fail-closed start gate）、
`CustomModelGateway`（OpenAI-compatible Model Gateway，凭据仅请求作用域）、
`AssistantFacade`（统一 Host dispatch：message/approve/reject/cancel）。
统一助手 UI 工作台、真实 Pi SDK/CLI 进程 adapter、完整 multi-engine runtime E2E 仍未完成。

### 2.1 ADR-035 Host 当前边界（与 vault residual 314–353 对齐）

- 生产允许：`DirectTurnEngine`、`ReadonlyAnalysisTurnEngine`、`LangGraphWorkflowAdapter`、
  `ProposalKernel`、`CapabilityResolver`、`CustomModelGateway`、`AssistantFacade`。
- open chat send/stream 经 `AssistantFacade` → 同一 `DirectTurnEngine`（`IOpenChatTurnPort`），不旁路 raw chatExecution；
  `ReadonlyAnalysisTurnEngine` 不接管 open chat 默认路径。
- 新工作台应经 `AssistantFacade.dispatch`（message / approve_proposal / reject_proposal /
  cancel_run）；approve 只做 ProposalKernel 生命周期，不自动 `executeApproved` 业务 mutation。
- residual 345：HTTP `POST /api/v1/ai/assistant/dispatch/sse` 经 `AIAssistantFacadeController` →
  `handlers.dispatchAssistant` → `module.assistantFacade`；`identityId` 仅来自 auth ExecutionContext。
- residual 347/353：客户端 `AIClientPort.dispatchAssistant` + `AIAssistantHttpAdapter`（Web SSE）+
  Desktop `AIAssistantIpcAdapter` stream（`ASSISTANT_DISPATCH_*` 通道）；body 永不带 `identityId`。
- residual 349：Vue `useAssistantDispatch` 薄入口（message/approve/reject/cancel）；body 永不带 `identityId`。
- residual 351：open chat 默认发送路径经 `dispatchAssistant`/`AssistantFacade`（live `message.delta` +
  model selection）；不再走 `AIChatService.streamMessage` 旁路。
- direct-provider completion 经共享 `CustomModelGateway`（`IModelGatewayPort`）；结果只回 `modelBindingId`，
  不把 API key 写入结果/事件。
- `knowledge.generate` start 门禁经共享 `CapabilityResolver.resolveFor` fail-closed；
  workflow offers 永不含 `tool.mutation` / `tool.proposal`。
- Engine 标签永不静默替代 mutation/context；CapabilityResolver 永不静默 expand `engine.*`。
- ProposalKernel `executeApproved` 只发 lifecycle receipt，业务 mutation 仍须用户确认后的 executor。

## 3. 用户路径

- 统一助手路径：用户进入 AI 工作区开始对话；助手可以直接回答，也可以根据意图启动 goal/knowledge workflow，并把结构化结果放入右侧工作台。
- 目标生成路径：用户在 AI Chat 中表达目标意图，AI 生成目标草稿，用户编辑确认后创建真实目标和关键结果。
- 知识笔记路径：Agent 根据运行时可用上下文、知识库结构和用户当前指令提出 path/title/frontmatter/content/reason，用户确认后由 Desktop 写文件或 Web 创建 Git commit。
- Provider 配置路径：用户在设置中配置 AI provider，添加 API key，选择默认模型。
- 移动端路径：移动端提供 AI Chat 入口。

## 4. 业务规则

- AIConversation 是 AI 模块核心聚合，AIProviderConfig 是独立聚合，Message 是关联实体。
- AI 模块不绕过业务模块写入业务数据：draft/plan 阶段产出结构化草稿或计划；execute/auto-execute 阶段可在 approved plan/actions 约束下通过 tool executor 调用 Goal、Task、Repository 等业务模块完成写入。
- 知识笔记遵循 ADR-034：未绑定时仅 Desktop 本地确认写入；绑定 GitHub 后 Web 可经 Repository/GitHub App 创建新文件，但不能直接写 read model。
- Goal workflow 分为多个阶段：clarification → draft → automation，每个阶段有独立的 contract 和 handler。
- Knowledge workflow 包括 note generation、expansion、indexing、query 四个子流程。
- 未绑定 GitHub 时 Knowledge workflow 只使用 Desktop 本地来源；绑定后服务端从 GitHub commit 投影并建立 RAG。
- Provider 配置使用 AES-256-GCM 加密存储 API key。
- 运行时模式选择：direct-provider（直连 LLM API）或 remote-ai-service（委托给 Python FastAPI 服务）。
- ai-service 是独立的 Python/FastAPI 应用，通过 HMAC 签名的 HTTP 请求与主应用通信。
- 客户端通过 HTTP 或 IPC 适配器访问 AI 能力，服务端通过模块组合根装配用例和仓储实现。
- 目标态遵循 ADR-035：Agent Host 拥有产品状态、Capability、Context、Tool Policy、Proposal、审批和执行；LangGraph 作为 Workflow Engine，Pi/远程 Agent/本地 CLI 作为候选 Turn Engine，自定义 AI API 作为 Model Gateway。
- Query/Proposal 工具可以暴露给 Turn Engine；Mutation 工具不进入 Engine，只由确认后的 TypeScript Executor 调用。
- 一次 AgentRun 固定 ResolvedRunPlan 与 CapabilitySnapshot；切换 Engine 必须新建或 fork Run，不能静默改变数据外传边界。

## 5. 相关文件索引

详细文件清单见 [AI 模块文件索引](../module-index/ai-files.md)。

## 6. 当前问题

- AI 写入边界必须清晰：当前 goal automation 可在 approved plan/actions 约束下通过 tool executor 调用 Goal/Task 模块创建目标和任务，需要确认自动执行场景的产品边界。
- Goal workflow、Knowledge workflow 与业务模块之间的耦合较深，workflow 变更可能影响多个模块。
- Provider capability、workflow command、response contract 的一致性需要持续维护。
- ai-service 的部署和运维复杂度较高（独立 Python 应用 + HMAC 签名 + LLM provider 抽象）。
- 知识索引的向量搜索能力和准确性需要进一步验证。
- Web 知识笔记已走 confirmed-create → Git commit；旧数据库 Repository 写路径不应再作为产品叙述。
- 知识索引/webhook/幂等/删除后向量清理仍需持续 harden。
- ADR-035 contracts 与 Host adapters（DirectTurn / ReadonlyAnalysisTurn / LangGraph workflow /
  ProposalKernel / CapabilityResolver / CustomModelGateway / AssistantFacade）已部分落地；
  统一助手 UI 工作台、真实 Pi SDK/CLI 进程 adapter 与完整 multi-engine runtime E2E 仍未完成。
- 当前 `AgentAction` 的开放 payload、`supportsXxx` 布尔能力和 framework-oriented node event 仍需按新方案收敛。
- 当前缺少 Pi Turn Engine、自定义 Model Gateway 收口和 Desktop local CLI adapter。

## 7. 优化机会

- 在已落地的 Proposal Kernel / Capability Resolver 之上补齐 AssistantFacade 与统一助手 UI 工作台。
- 将右侧业务面板升级为 Goal/Knowledge/Task 共用的 Artifact 与审批工作台。
- 梳理 AI 模块与业务模块的写入边界，建立更清晰的“AI 建议 → 用户确认 → 业务写入”链路。
- 为知识索引提供更好的管理和维护能力。
- 考虑 AI 模块的缓存和成本控制策略。
- 统一 direct-provider 和 remote-ai-service 两种运行时的行为差异。

## 8. 风险点

- AI 写入边界必须清晰：允许的副作用必须经过 approved plan/actions 和业务模块 executor，不能绕过 Goal/Task/Repository 等模块直接落库。
- Provider capability、workflow command、response contract 的一致性。
- Goal workflow、Knowledge workflow 与业务模块之间的耦合。
- ai-service 的可用性和延迟直接影响 AI 功能的用户体验。
- API key 的安全存储和传输。
- 知识索引的向量数据一致性和存储成本。
- Agent 读取的知识内容可能包含提示注入、路径穿越或越权指令，不能绕过系统安全和用户确认。
- 本地 CLI 可能拥有 Shell、文件和网络权限，不能仅依靠 cwd 或 Prompt 视为安全沙箱。
- 本地 Engine 不可用时静默 fallback 到云 API 会改变数据外传边界，必须禁止。

## 9. 后续待确认

- AI 自动执行应开放到什么程度：严格限制为"建议 → 确认"模式，还是允许在 approved plan/actions 约束下自动执行。
- Knowledge workflow 的产品价值和用户场景是否需要重新评估。
- ai-service 是否需要支持更多 LLM provider。
- AI 模块的成本控制和使用配额策略。
- 知识索引是否需要支持更多数据源。
- Server workflow 是否需要通过 durable Activity Lease 等待 Desktop 本地 CLI。
- 是否在至少两个稳定实现出现后开放第三方 Agent 插件 SDK。

## 10. 相关资料

- [目标模块说明](./goal.md)
- [资源库模块说明](./repository.md)
- [ADR-034: 本地 Obsidian Vault 与可选 GitHub 知识仓库](../../architecture/adr/ADR-034-obsidian-vault-repository.md)
- [ADR-035: 统一助手与可插拔 Agent Host](../../architecture/adr/ADR-035-unified-assistant-agent-host.md)
- [统一助手与可插拔 Agent Host 实施方案](../../plan/active/2026-07-17-unified-assistant-agent-host.md)
- [AI 模块文件索引](../module-index/ai-files.md)
- [AI Goal workflow v1 文档集](../../guides/ai/goal-workflow-v1/README.md)
