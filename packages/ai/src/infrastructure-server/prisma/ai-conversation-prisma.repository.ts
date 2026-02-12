/**
 * AIConversation Prisma Repository
 *
 * Prisma implementation of IAIConversationRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAIConversationRepository, AIConversationQueryOptions } from '../../ports/ai-conversation-repository.port';
import type { AIConversation } from '../../domain-server/aggregates/ai-conversation';
import type { ConversationStatus } from '@dailyuse/contracts/ai';

/**
 * AIConversation Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AIConversationPrismaRepository implements IAIConversationRepository {
  constructor(private readonly prisma: any) {}

  async save(conversation: AIConversation): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByUuid(uuid: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string, options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByStatus(
    accountUuid: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findRecent(accountUuid: string, limit: number, offset?: number): Promise<AIConversation[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
