import type { AIConversationServerDTO } from '../../aggregates/ai-conversation-server';
import type { MessageServerDTO } from '../../entities/message-server';

export interface AIMessageAddedEvent {
  identityId: string;
  conversationId: string;
  conversation: AIConversationServerDTO;
  message: MessageServerDTO;
}
