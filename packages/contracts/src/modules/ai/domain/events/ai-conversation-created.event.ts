import type { AIConversationServerDTO } from '../../aggregates';

export interface AIConversationCreatedEvent {
  identityId: string;
  conversation: AIConversationServerDTO;
}
