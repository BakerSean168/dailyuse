/**
 * AIConversation Memory Repository
 *
 * In-memory implementation of IAIConversationRepository for testing.
 */

import type { IAIConversationRepository, AIConversationQueryOptions } from '../../ports/ai-conversation-repository.port';
import type { AIConversation } from '@/domain-server';
import type { ConversationStatus } from '@dailyuse/contracts/ai';

/**
 * AIConversation Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIConversationMemoryRepository implements IAIConversationRepository {
  private conversations = new Map<string, AIConversation>();

  async save(conversation: AIConversation): Promise<void> {
    this.conversations.set((conversation as any).uuid, conversation);
  }

  async findByUuid(uuid: string, _options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    return this.conversations.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string, _options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    return Array.from(this.conversations.values()).filter((c: any) => c.accountUuid === accountUuid);
  }

  async findByStatus(
    accountUuid: string,
    status: ConversationStatus,
    _options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    return Array.from(this.conversations.values()).filter(
      (c: any) => c.accountUuid === accountUuid && c.status === status,
    );
  }

  async findRecent(accountUuid: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const filtered = Array.from(this.conversations.values())
      .filter((c: any) => c.accountUuid === accountUuid)
      .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return filtered.slice(offset ?? 0, (offset ?? 0) + limit);
  }

  async delete(uuid: string): Promise<void> {
    this.conversations.delete(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    return this.conversations.has(uuid);
  }

  // Test helpers
  clear(): void {
    this.conversations.clear();
  }

  seed(conversations: AIConversation[]): void {
    conversations.forEach((c: any) => this.conversations.set(c.uuid, c));
  }
}
