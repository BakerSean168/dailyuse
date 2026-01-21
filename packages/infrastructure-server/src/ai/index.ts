/**
 * AI Module - Infrastructure Server
 *
 * Ports and Adapters for AI module persistence.
 */

// Container
export { AIContainer } from './ai.container';
export { AIModule } from './ai.module';

// Ports (Interfaces)
export { type IAIConversationRepository, type AIConversationQueryOptions } from './ports/ai-conversation-repository.port';
export { type IAIGenerationTaskRepository } from './ports/ai-generation-task-repository.port';
export { type IAIProviderConfigRepository } from './ports/ai-provider-config-repository.port';
export { type IAIUsageQuotaRepository } from './ports/ai-usage-quota-repository.port';

// Prisma Adapters
export { AIConversationPrismaRepository } from './adapters/prisma/ai-conversation-prisma.repository';
export { AIGenerationTaskPrismaRepository } from './adapters/prisma/ai-generation-task-prisma.repository';
export { AIProviderConfigPrismaRepository } from './adapters/prisma/ai-provider-config-prisma.repository';
export { AIUsageQuotaPrismaRepository } from './adapters/prisma/ai-usage-quota-prisma.repository';

// Memory Adapters
export { AIConversationMemoryRepository } from './adapters/memory/ai-conversation-memory.repository';
export { AIGenerationTaskMemoryRepository } from './adapters/memory/ai-generation-task-memory.repository';
export { AIProviderConfigMemoryRepository } from './adapters/memory/ai-provider-config-memory.repository';
export { AIUsageQuotaMemoryRepository } from './adapters/memory/ai-usage-quota-memory.repository';
