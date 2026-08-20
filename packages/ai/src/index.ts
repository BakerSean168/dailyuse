/**
 * @memoflow/ai
 *
 * AI module runtime root.
 *
 * Public AI contracts are centralized in `@memoflow/contracts/ai`.
 * Root exports are limited to the canonical server composition roots:
 * ingredient factories, set types, module factory, runtime contribution
 * factories and port types. Client / API / Electron seams use dedicated
 * subpaths.
 *
 * AI 模块运行时根。
 * 公开契约集中在 `@memoflow/contracts/ai`。
 * 根导出仅限于规范化的服务端组合根：原料工厂、集合类型、模块工厂、
 * 运行时贡献工厂与 Port 类型。Client / API / Electron 使用独立 subpath。
 */

export {
  createAIModule,
  createAIPowerSyncModule,
  createAIPowerSyncRepositories,
  createAIPrismaRepositories,
  createMastraStorage,
  MastraAIRuntime,
  MastraModelResolver,
  type MastraStorageConfig,
  type AIModuleDependencies,
  type AIModuleInstance,
  type AIModuleServices,
  type AIApplicationPort,
  type AIModuleRuntimeContribution,
  type AIRuntimeContributionsInput,
  type AIModulePowerSyncOptions,
  type AIPowerSyncRepositorySet,
  type AIPrismaRepositorySet,
  type IAIConversationRepository,
  type IAIProviderConfigRepository,
} from './server';
export { getAIServiceRuntimeConfig, type AIServiceRuntimeConfig } from './shared/config/env';
export {
  AIEvaluationReportFileAdapter,
  AIServiceAgentRuntimeAdapter,
  AIServiceAnalyticsQueryAdapter,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
  AIServiceKnowledgeQueryAdapter,
} from './server/infrastructure';
// Host capability ports are re-exported through the package root so desktop
// composers import only `@memoflow/ai` (no `/ports` subpath).
// 宿主能力 Ports 通过包根重新导出，使 desktop composer 只导入 `@memoflow/ai`。
export type {
  IAnalyticsReadPort,
  IKnowledgeSourcePort,
  IKnowledgeNotePersistencePort,
  IAIAutomationToolExecutorPort,
} from './ports';
