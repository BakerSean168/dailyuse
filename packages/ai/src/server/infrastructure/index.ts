/**
 * AI Module — Infrastructure Server exports.
 * AI 模块 — 基础设施服务端导出。
 *
 * Re-exports the composition root, adapters, and runtime composition roots.
 * 重新导出组合根、适配器与运行时组合根。
 */

// ---------------------------------------------------------------------------
// Composition Root (canonical entry point)
// 组合根（规范入口）
// ---------------------------------------------------------------------------
export {
  createAIModule,
  type AIModuleDependencies,
  type AIModuleInstance,
  type AIModuleServices,
  type AIModuleRuntimeContribution,
  type AIRuntimeContributionsInput,
} from './ai.module';
export type { AIApplicationPort } from '../application';

// ---------------------------------------------------------------------------
// PowerSync convenience factory
// PowerSync 便捷工厂
// ---------------------------------------------------------------------------
export { createAIPowerSyncModule, type AIModulePowerSyncOptions } from './powersync';

// ---------------------------------------------------------------------------
// Ports (Interfaces)
// ---------------------------------------------------------------------------
export { type IAIConversationRepository, type AIConversationQueryOptions } from '../domain';
export { type IAIProviderConfigRepository } from '../domain';

// ---------------------------------------------------------------------------
// Prisma Adapters
// ---------------------------------------------------------------------------
export {
  AIConversationPrismaRepository,
  AIProviderConfigPrismaRepository,
  AIKnowledgeIndexPrismaRepository,
  AIExecutionLogPrismaAdapter,
  LangGraphCheckpointPrismaAdapter,
} from './adapters/prisma';

// ---------------------------------------------------------------------------
// Filesystem Adapters
// ---------------------------------------------------------------------------
export {
  AIEvaluationReportFileAdapter,
  type AIEvaluationReportFileAdapterOptions,
} from './adapters/fs';

// ---------------------------------------------------------------------------
// PowerSync Adapters
// ---------------------------------------------------------------------------
export {
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
  AIKnowledgeIndexPowerSyncRepository,
  AIExecutionLogPowerSyncAdapter,
} from './adapters/powersync';

// ---------------------------------------------------------------------------
// Chat Execution Adapters
// ---------------------------------------------------------------------------
export {
  AIServiceAnalyticsQueryAdapter,
  AIServiceAgentRuntimeAdapter,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeQueryAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
  DirectProviderChatExecutionAdapter,
  DirectProviderGoalPlanningAdapter,
  DirectProviderKnowledgeNoteGenerationAdapter,
  type AIServiceInternalClientOptions,
  INTERNAL_CONTENT_HASH_HEADER,
  INTERNAL_SERVICE_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
  buildInternalSignaturePayload,
  computeContentSha256,
  signInternalRequest,
} from './chat-execution';

// ---------------------------------------------------------------------------
// Turn Engine (ADR-035)
// ---------------------------------------------------------------------------
export { DirectTurnEngine, DIRECT_TURN_ENGINE_ID } from './turn-engine';

// ---------------------------------------------------------------------------
// Workflow Adapter (ADR-035)
// ---------------------------------------------------------------------------
export {
  LangGraphWorkflowAdapter,
  LANGGRAPH_WORKFLOW_ADAPTER_ID,
} from './workflow';

