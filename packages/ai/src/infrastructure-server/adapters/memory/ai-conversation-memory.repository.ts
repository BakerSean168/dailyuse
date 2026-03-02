/**
 * AIConversation Memory Repository
 *
 * In-memory implementation of IAIConversationRepository for testing.
 */

import type { IAIConversationRepository, AIConversationQueryOptions } from '../../../domain-server';
import type { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import type { ConversationStatus } from '@dailyuse/contracts/ai';

/**
 * AIConversation Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIConversationMemoryRepository implements IAIConversationRepository {
  private conversations = new Map<string, AIConversation>();

  async save(conversation: AIConversation): Promise<void> {
    this.conversations.set((conversation as any).id, conversation);
  }

  async findById(
    id: string,
    _options?: AIConversationQueryOptions,
  ): Promise<AIConversation | null> {
    return this.conversations.get(id) ?? null;
  }

  async findByIdentityId(
    identityId: string,
    _options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    return Array.from(this.conversations.values()).filter((c: any) => c.identityId === identityId);
  }

  async findByStatus(
    identityId: string,
    status: ConversationStatus,
    _options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    return Array.from(this.conversations.values()).filter(
      (c: any) => c.identityId === identityId && c.status === status,
    );
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const filtered = Array.from(this.conversations.values())
      .filter((c: any) => c.identityId === identityId)
      .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return filtered.slice(offset ?? 0, (offset ?? 0) + limit);
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.conversations.has(id);
  }

  // Test helpers
  clear(): void {
    this.conversations.clear();
  }

  seed(conversations: AIConversation[]): void {
    conversations.forEach((c: any) => this.conversations.set(c.id, c));
  }
}
