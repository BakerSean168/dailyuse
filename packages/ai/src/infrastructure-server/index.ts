/**
 * AI Module — Infrastructure Server exports.
 * AI 模块 — 基础设施服务端导出。
 *
 * Re-exports the composition root, adapters, and legacy classes.
 * 重新导出组合根、适配器和遗留类。
 */

// ---------------------------------------------------------------------------
// Composition Root (canonical entry point)
// 组合根（规范入口）
// ---------------------------------------------------------------------------
export {
  createAIModule,
  createAIUseCases,
  type AIModuleDependencies,
  type AIModuleInstance,
  type AIModuleUseCases,
  type AIModuleServices,
  type AIApplicationPort,
  type AIModuleRuntimeContribution,
  type AIRuntimeContributionsInput,
} from './ai.module';

// ---------------------------------------------------------------------------
// PowerSync convenience factory
// PowerSync 便捷工厂
// ---------------------------------------------------------------------------
export { createAIPowerSyncModule, type AIModulePowerSyncOptions } from './powersync';

// ---------------------------------------------------------------------------
// Ports (Interfaces)
// ---------------------------------------------------------------------------
export { type IAIConversationRepository, type AIConversationQueryOptions } from '../domain-server';
export { type IAIProviderConfigRepository } from '../domain-server';

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
