import type { AIConversationServerDTO } from '../../aggregates/ai-conversation-server';

export interface AIConversationCreatedEvent {
  identityId: string;
  conversation: AIConversationServerDTO;
}
