import type { AIConversationServerDTO } from '../../aggregates';

export interface AIConversationUpdatedEvent {
  identityId: string;
  conversation: AIConversationServerDTO;
  changes: string[];
}
