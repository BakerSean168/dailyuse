import type { AIConversationServerDTO } from '../../aggregates';
import type { MessageServerDTO } from '../../entities';

export interface AIMessageAddedEvent {
  identityId: string;
  conversationId: string;
  conversation: AIConversationServerDTO;
  message: MessageServerDTO;
}
