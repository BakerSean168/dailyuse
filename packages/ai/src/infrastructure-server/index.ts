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
} from '../domain-server';
export { type IAIGenerationTaskRepository, type IAIProviderConfigRepository, type IAIUsageQuotaRepository } from '../domain-server';

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
  SqliteKnowledgeGenerationTaskRepository,
} from './adapters/sqlite';

// SQLite schema
export { AI_MODULE_SCHEMA } from './adapters/sqlite/schema';
