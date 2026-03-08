/**
 * AI Module - Infrastructure Server
 *
 * Ports and Adapters for AI module persistence.
 */

// DI Module
export { AIModule } from './ai.module';

// DI Factory
export { AIRepositoryFactory } from './di';
export * from './di/ai-container';

// Ports (Interfaces)
export { type IAIConversationRepository, type AIConversationQueryOptions } from '../domain-server';
export { type IAIProviderConfigRepository } from '../domain-server';

// Prisma Adapters
export {
  AIConversationPrismaRepository,
  AIProviderConfigPrismaRepository,
} from './adapters/prisma';

// SQLite Adapters
export {
  SqliteAIConversationRepository,
  SqliteAIProviderConfigRepository,
} from './adapters/sqlite';

// SQLite schema
export { AI_MODULE_SCHEMA } from './adapters/sqlite/schema';
