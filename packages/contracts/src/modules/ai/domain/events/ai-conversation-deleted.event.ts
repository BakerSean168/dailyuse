import type { AIConversationServerDTO } from '../../aggregates';

export interface AIConversationDeletedEvent {
  identityId: string;
  conversationId: string;
  conversation: AIConversationServerDTO;
  deletedAt: number;
}
