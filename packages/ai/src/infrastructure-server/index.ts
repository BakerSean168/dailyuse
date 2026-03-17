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
  createAIServices,
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
} from './adapters/prisma';

// ---------------------------------------------------------------------------
// PowerSync Adapters
// ---------------------------------------------------------------------------
export {
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
} from './adapters/powersync';
