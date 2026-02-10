/**
 * AI Module - Infrastructure Server
 *
 * Ports and Adapters for AI module persistence.
 */

// DI Module
export { AIModule } from './ai.module';

// DI Factory
export { AIRepositoryFactory } from './di';

// Ports (Interfaces)
export {
  type IAIConversationRepository,
  type AIConversationQueryOptions,
} from './ports/ai-conversation-repository.port';
export { type IAIGenerationTaskRepository } from './ports/ai-generation-task-repository.port';
export { type IAIProviderConfigRepository } from './ports/ai-provider-config-repository.port';
export { type IAIUsageQuotaRepository } from './ports/ai-usage-quota-repository.port';

// Prisma Adapters
export {
  AIConversationPrismaRepository,
  AIGenerationTaskPrismaRepository,
  AIProviderConfigPrismaRepository,
  AIUsageQuotaPrismaRepository,
} from './adapters/prisma';

// SQLite Adapters
export {
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIProviderConfigRepository,
  SqliteAIUsageQuotaRepository,
} from './adapters/sqlite';
