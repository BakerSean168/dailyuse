---
tags:
  - product
  - module-index
  - ai
description: AI 模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-07-22T00:00:00
---

# AI 模块文件索引

本索引用于连接 AI 模块的业务说明和真实代码。它不是代码注释替代品；做优化前仍需以当前代码、配置和测试为准。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/ai/router/index.ts`](../../../packages/app-vue/src/modules/ai/router/index.ts) | Vue AI 模块路由，定义 AI Chat 入口 |
| [`packages/app-vue/src/modules/ai/views/AIChatView.vue`](../../../packages/app-vue/src/modules/ai/views/AIChatView.vue) | AI Chat 主页面 |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/ai/composables/useAI.ts`](../../../packages/app-vue/src/modules/ai/composables/useAI.ts) | AI 主组合函数 |
| [`packages/app-vue/src/modules/ai/composables/useAIChatView.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIChatView.ts) | Chat 视图状态管理 |
| [`packages/app-vue/src/modules/ai/composables/useAIChatSession.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIChatSession.ts) | Chat 会话生命周期 |
| [`packages/app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts) | Goal workflow 组合函数 |
| [`packages/app-vue/src/modules/ai/composables/useAIKnowledgeNoteWorkflow.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIKnowledgeNoteWorkflow.ts) | 知识笔记 workflow 组合函数 |
| [`packages/app-vue/src/modules/ai/composables/useAIModelSelection.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIModelSelection.ts) | 模型选择组合函数 |
| [`packages/app-vue/src/modules/ai/composables/goalDraftHelpers.ts`](../../../packages/app-vue/src/modules/ai/composables/goalDraftHelpers.ts) | Goal draft 辅助逻辑 |
| [`packages/app-vue/src/modules/ai/composables/goalAutomationHelpers.ts`](../../../packages/app-vue/src/modules/ai/composables/goalAutomationHelpers.ts) | Goal automation 辅助逻辑 |
| [`packages/app-vue/src/modules/ai/components/AIConversationSidebar.vue`](../../../packages/app-vue/src/modules/ai/components/AIConversationSidebar.vue) | 对话列表侧边栏 |
| [`packages/app-vue/src/modules/ai/components/AIMessagePanel.vue`](../../../packages/app-vue/src/modules/ai/components/AIMessagePanel.vue) | 消息展示面板 |
| [`packages/app-vue/src/modules/ai/components/AIFooterComposer.vue`](../../../packages/app-vue/src/modules/ai/components/AIFooterComposer.vue) | 消息输入组件 |
| [`packages/app-vue/src/modules/ai/components/AIGoalWorkflowPanel.vue`](../../../packages/app-vue/src/modules/ai/components/AIGoalWorkflowPanel.vue) | Goal workflow UI 面板 |
| [`packages/app-vue/src/modules/ai/components/AIGoalDraftEditor.vue`](../../../packages/app-vue/src/modules/ai/components/AIGoalDraftEditor.vue) | Goal draft 编辑器 |

## 移动端入口

| 文件 | 说明 |
| --- | --- |
| [`apps/mobile/src/app/explore/ai.tsx`](../../../apps/mobile/src/app/explore/ai.tsx) | 移动端 AI 入口 |
| [`packages/app-react/src/screens/AIScreen.tsx`](../../../packages/app-react/src/screens/AIScreen.tsx) | React Native AI 屏幕 |

## AI Service（Python/FastAPI）

| 文件 | 说明 |
| --- | --- |
| [`apps/ai-service/src/ai_service/main.py`](../../../apps/ai-service/src/ai_service/main.py) | FastAPI 应用入口 |
| [`apps/ai-service/src/ai_service/app.py`](../../../apps/ai-service/src/ai_service/app.py) | 应用组合根 |
| [`apps/ai-service/src/ai_service/orchestrator/orchestrator.py`](../../../apps/ai-service/src/ai_service/orchestrator/orchestrator.py) | Workflow 调度器 |
| [`apps/ai-service/src/ai_service/orchestrator/handlers/goal_handler.py`](../../../apps/ai-service/src/ai_service/orchestrator/handlers/goal_handler.py) | Goal workflow handler |
| [`apps/ai-service/src/ai_service/orchestrator/handlers/goal_automation_handler.py`](../../../apps/ai-service/src/ai_service/orchestrator/handlers/goal_automation_handler.py) | Goal automation handler |
| [`apps/ai-service/src/ai_service/orchestrator/handlers/knowledge_handler.py`](../../../apps/ai-service/src/ai_service/orchestrator/handlers/knowledge_handler.py) | Knowledge workflow handler |
| [`apps/ai-service/src/ai_service/orchestrator/handlers/knowledge_note_handler.py`](../../../apps/ai-service/src/ai_service/orchestrator/handlers/knowledge_note_handler.py) | Knowledge note handler |
| [`apps/ai-service/src/ai_service/services/goal_planning_service.py`](../../../apps/ai-service/src/ai_service/services/goal_planning_service.py) | Goal planning 服务 |
| [`apps/ai-service/src/ai_service/services/knowledge_note_service.py`](../../../apps/ai-service/src/ai_service/services/knowledge_note_service.py) | Knowledge note 服务 |
| [`apps/ai-service/src/ai_service/services/knowledge_query_service.py`](../../../apps/ai-service/src/ai_service/services/knowledge_query_service.py) | Knowledge query 服务 |
| [`apps/ai-service/src/ai_service/providers/factory.py`](../../../apps/ai-service/src/ai_service/providers/factory.py) | LLM provider 工厂 |

## API、控制器与适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/ai/src/api/routes/ai-chat.routes.ts`](../../../packages/ai/src/api/routes/ai-chat.routes.ts) | Chat HTTP routes |
| [`packages/ai/src/api/routes/ai-provider.routes.ts`](../../../packages/ai/src/api/routes/ai-provider.routes.ts) | Provider 配置 HTTP routes |
| [`packages/ai/src/api/routes/ai-goal-generation.routes.ts`](../../../packages/ai/src/api/routes/ai-goal-generation.routes.ts) | 目标生成 HTTP routes |
| [`packages/ai/src/api/routes/ai-knowledge-note.routes.ts`](../../../packages/ai/src/api/routes/ai-knowledge-note.routes.ts) | 知识笔记 HTTP routes |
| [`packages/ai/src/api/routes/ai-knowledge-query.routes.ts`](../../../packages/ai/src/api/routes/ai-knowledge-query.routes.ts) | 知识查询 HTTP routes |
| [`packages/ai/src/api/routes/ai-analytics-query.routes.ts`](../../../packages/ai/src/api/routes/ai-analytics-query.routes.ts) | 分析查询 HTTP routes |
| [`packages/ai/src/server/transport/ai-chat.controller.ts`](../../../packages/ai/src/server/transport/ai-chat.controller.ts) | Chat 控制器 |
| [`packages/ai/src/server/transport/ai-goal-generation.controller.ts`](../../../packages/ai/src/server/transport/ai-goal-generation.controller.ts) | 目标生成控制器 |
| [`packages/ai/src/infrastructure-client/adapters/http/ai-message-http.adapter.ts`](../../../packages/ai/src/infrastructure-client/adapters/http/ai-message-http.adapter.ts) | 客户端 HTTP 消息适配器 |
| [`packages/ai/src/infrastructure-client/adapters/ipc/ai-message-ipc.adapter.ts`](../../../packages/ai/src/infrastructure-client/adapters/ipc/ai-message-ipc.adapter.ts) | 客户端 IPC 消息适配器 |

## 领域、用例与仓储

| 文件 | 说明 |
| --- | --- |
| [`packages/ai/src/server/domain/aggregates/ai-conversation.ts`](../../../packages/ai/src/server/domain/aggregates/ai-conversation.ts) | AIConversation 聚合根 |
| [`packages/ai/src/server/domain/aggregates/ai-provider-config.ts`](../../../packages/ai/src/server/domain/aggregates/ai-provider-config.ts) | AIProviderConfig 聚合根 |
| [`packages/ai/src/server/domain/entities/message.ts`](../../../packages/ai/src/server/domain/entities/message.ts) | Message 实体 |
| [`packages/ai/src/server/domain/services/ai-generation-validation-service.ts`](../../../packages/ai/src/server/domain/services/ai-generation-validation-service.ts) | AI 生成验证服务 |
| [`packages/ai/src/server/application/ports/chat-execution.port.ts`](../../../packages/ai/src/server/application/ports/chat-execution.port.ts) | Chat 执行端口 |
| [`packages/ai/src/server/application/ports/goal-planning.port.ts`](../../../packages/ai/src/server/application/ports/goal-planning.port.ts) | Goal planning 端口 |
| [`packages/ai/src/server/application/ports/knowledge-note-persistence.port.ts`](../../../packages/ai/src/server/application/ports/knowledge-note-persistence.port.ts) | 知识笔记持久化端口 |
| [`packages/ai/src/server/application/use-cases/commands/send-ai-message.use-case.ts`](../../../packages/ai/src/server/application/use-cases/commands/send-ai-message.use-case.ts) | 发送消息用例 |
| [`packages/ai/src/server/application/use-cases/commands/generate-ai-goal.use-case.ts`](../../../packages/ai/src/server/application/use-cases/commands/generate-ai-goal.use-case.ts) | 目标生成用例 |
| [`packages/ai/src/server/application/use-cases/commands/manage-ai-knowledge-note.use-case.ts`](../../../packages/ai/src/server/application/use-cases/commands/manage-ai-knowledge-note.use-case.ts) | 知识笔记管理用例 |
| [`packages/ai/src/server/infrastructure/ai.module.ts`](../../../packages/ai/src/server/infrastructure/ai.module.ts) | 服务端 AI 模块组合根 |
| [`packages/ai/src/server/infrastructure/runtime/direct-provider-ai.runtime.ts`](../../../packages/ai/src/server/infrastructure/runtime/direct-provider-ai.runtime.ts) | 直连 provider 运行时 |
| [`packages/ai/src/server/infrastructure/runtime/remote-ai-service.runtime.ts`](../../../packages/ai/src/server/infrastructure/runtime/remote-ai-service.runtime.ts) | 远程 ai-service 运行时 |
| [`packages/ai/src/server/infrastructure/security/ai-secret-cipher.ts`](../../../packages/ai/src/server/infrastructure/security/ai-secret-cipher.ts) | API key 加密（AES-256-GCM） |


## ADR-035 Agent Host 生产适配（residual 314–351）

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/ai/agent-host/ports.ts`](../../../packages/contracts/src/modules/ai/agent-host/ports.ts) | Host Port 形状（Turn/Workflow/Capability/Proposal） |
| [`packages/contracts/src/modules/ai/agent-host/capabilities.ts`](../../../packages/contracts/src/modules/ai/agent-host/capabilities.ts) | CapabilityOffer/Requirement + resolveRunPlan |
| [`packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts`](../../../packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts) | 生产 DirectTurnEngine（开放式 chat） |
| [`packages/ai/src/server/infrastructure/turn-engine/readonly-analysis.turn-engine.ts`](../../../packages/ai/src/server/infrastructure/turn-engine/readonly-analysis.turn-engine.ts) | 生产 ReadonlyAnalysisTurnEngine（engine.pi_readonly，Model Gateway） |
| [`packages/ai/src/server/infrastructure/workflow/langgraph-workflow.adapter.ts`](../../../packages/ai/src/server/infrastructure/workflow/langgraph-workflow.adapter.ts) | LangGraph Workflow Adapter |
| [`packages/ai/src/server/infrastructure/proposal-kernel/proposal.kernel.ts`](../../../packages/ai/src/server/infrastructure/proposal-kernel/proposal.kernel.ts) | ProposalKernel 生命周期 |
| [`packages/ai/src/server/infrastructure/capability-resolver/capability.resolver.ts`](../../../packages/ai/src/server/infrastructure/capability-resolver/capability.resolver.ts) | CapabilityResolver fail-closed |
| [`packages/ai/src/server/infrastructure/model-gateway/custom-model.gateway.ts`](../../../packages/ai/src/server/infrastructure/model-gateway/custom-model.gateway.ts) | 生产 CustomModelGateway（OpenAI-compatible Model Gateway） |
| [`packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts`](../../../packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts) | 生产 AssistantFacade（统一 Host dispatch） |
| [`packages/ai/src/server/transport/ai-assistant-facade.controller.ts`](../../../packages/ai/src/server/transport/ai-assistant-facade.controller.ts) | AssistantFacade 传输控制器（identity 仅 ExecutionContext） |
| [`packages/ai/src/api/routes/ai-assistant.routes.ts`](../../../packages/ai/src/api/routes/ai-assistant.routes.ts) | AssistantFacade SSE 路由 `/ai/assistant/dispatch/sse` |
| [`packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.ts`](../../../packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.ts) | Web AssistantFacade 客户端 HTTP/SSE 适配器 |
| [`packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts`](../../../packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts) | Desktop AssistantFacade 客户端 IPC 适配器（NOT_SUPPORTED） |
| [`packages/app-vue/src/modules/ai/composables/useAssistantDispatch.ts`](../../../packages/app-vue/src/modules/ai/composables/useAssistantDispatch.ts) | Vue AssistantFacade 薄入口 composable |
| [`packages/app-vue/src/modules/ai/composables/useAIChatSession.ts`](../../../packages/app-vue/src/modules/ai/composables/useAIChatSession.ts) | open chat 默认经 dispatchAssistant（residual 351） |
| [`packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-capability-turn-isolation.journey.spec.ts`](../../../packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-capability-turn-isolation.journey.spec.ts) | ADR-035 isolation journey |
| [`packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-product-docs-boundary.surface.spec.ts`](../../../packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-product-docs-boundary.surface.spec.ts) | product docs 边界锁 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/ai/index.ts`](../../../packages/contracts/src/modules/ai/index.ts) | AI 模块 contracts 入口 |
| [`packages/contracts/src/modules/ai/aggregates/ai-conversation-server.ts`](../../../packages/contracts/src/modules/ai/aggregates/ai-conversation-server.ts) | AIConversation 服务端 DTO |
| [`packages/contracts/src/modules/ai/aggregates/ai-provider-config-server.ts`](../../../packages/contracts/src/modules/ai/aggregates/ai-provider-config-server.ts) | AIProviderConfig 服务端 DTO |
| [`packages/contracts/src/modules/ai/api/ai-chat.dto.ts`](../../../packages/contracts/src/modules/ai/api/ai-chat.dto.ts) | Chat API DTO |
| [`packages/contracts/src/modules/ai/api/ai-goal-generation.dto.ts`](../../../packages/contracts/src/modules/ai/api/ai-goal-generation.dto.ts) | 目标生成 DTO |
| [`packages/contracts/src/modules/ai/api/ai-goal-automation.dto.ts`](../../../packages/contracts/src/modules/ai/api/ai-goal-automation.dto.ts) | 目标自动化 DTO |
| [`packages/contracts/src/modules/ai/api/ai-knowledge-note.dto.ts`](../../../packages/contracts/src/modules/ai/api/ai-knowledge-note.dto.ts) | 知识笔记 DTO |
| [`packages/contracts/src/modules/ai/protocol/ai-event-map.ts`](../../../packages/contracts/src/modules/ai/protocol/ai-event-map.ts) | AI 模块事件 map |
| [`packages/contracts/src/modules/ai/protocol/ai-rpc-map.ts`](../../../packages/contracts/src/modules/ai/protocol/ai-rpc-map.ts) | AI 模块 RPC map |
| [`packages/database/prisma/schema/ai.prisma`](../../../packages/database/prisma/schema/ai.prisma) | AI 模块 Prisma schema |

## 跨模块适配器

| 文件 | 说明 |
| --- | --- |
| [`apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts`](../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts) | Goal/Task 自动化 tool executor |
| [`apps/api/src/modules/ai/controlled-analytics-read.adapter.ts`](../../../apps/api/src/modules/ai/controlled-analytics-read.adapter.ts) | 分析数据读取适配器 |
| [`apps/api/src/modules/ai/repository-knowledge-note-persistence.adapter.ts`](../../../apps/api/src/modules/ai/repository-knowledge-note-persistence.adapter.ts) | 知识笔记持久化适配器 |
| [`apps/api/src/modules/ai/repository-knowledge-source.adapter.ts`](../../../apps/api/src/modules/ai/repository-knowledge-source.adapter.ts) | 知识源适配器 |
| [`apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts`](../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts) | Desktop 侧 automation executor |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/ai/src/server/domain/aggregates/__tests__/ai-conversation.spec.ts`](../../../packages/ai/src/server/domain/aggregates/__tests__/ai-conversation.spec.ts) | AIConversation 聚合测试 |
| [`packages/ai/src/server/application/use-cases/commands/__tests__/ai-chat-application-service.test.ts`](../../../packages/ai/src/server/application/use-cases/commands/__tests__/ai-chat-application-service.test.ts) | Chat 应用服务测试 |
| [`packages/ai/src/server/application/use-cases/commands/__tests__/goal-generation-application-service.test.ts`](../../../packages/ai/src/server/application/use-cases/commands/__tests__/goal-generation-application-service.test.ts) | 目标生成测试 |
| [`packages/ai/src/api/routes/ai-chat.routes.spec.ts`](../../../packages/ai/src/api/routes/ai-chat.routes.spec.ts) | Chat routes 测试 |
| [`apps/ai-service/tests/test_goal_planning.py`](../../../apps/ai-service/tests/test_goal_planning.py) | ai-service goal planning 测试 |
| [`apps/ai-service/tests/test_knowledge_note.py`](../../../apps/ai-service/tests/test_knowledge_note.py) | ai-service knowledge note 测试 |

## 需要重点关注的改动风险

- AI 直接写业务数据的边界。
- Goal workflow 和 Knowledge workflow 与业务模块的耦合。
- Provider 配置和 API key 的安全性。
- direct-provider 和 remote-ai-service 两种运行时的行为一致性。
- 知识索引的向量数据一致性。
