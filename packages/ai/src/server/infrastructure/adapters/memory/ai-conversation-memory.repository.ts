/**
 * AIConversation Memory Repository
 *
 * In-memory implementation of IAIConversationRepository for testing.
 */

import type { IAIConversationRepository, AIConversationQueryOptions } from '../../../domain';
import type { AIConversation } from '../../../domain/aggregates/ai-conversation';

/**
 * AIConversation Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIConversationMemoryRepository implements IAIConversationRepository {
  private conversations = new Map<string, AIConversation>();

  async save(conversation: AIConversation): Promise<void> {
    this.conversations.set(String(conversation.id), conversation);
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    void options;
    return this.conversations.get(id) ?? null;
  }

  async findByIdentityId(
    identityId: string,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    void options;
    return Array.from(this.conversations.values()).filter(
      (conversation) => String(conversation.identityId) === identityId,
    );
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  // Test helpers
  clear(): void {
    this.conversations.clear();
  }

  seed(conversations: AIConversation[]): void {
    conversations.forEach((conversation) => this.conversations.set(String(conversation.id), conversation));
  }
}
