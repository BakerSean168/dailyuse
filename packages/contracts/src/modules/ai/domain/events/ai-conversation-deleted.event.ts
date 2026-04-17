import type { AIConversationServerDTO } from '../../aggregates/ai-conversation-server';

export interface AIConversationDeletedEvent {
  identityId: string;
  conversationId: string;
  conversation: AIConversationServerDTO;
  deletedAt: number;
}
