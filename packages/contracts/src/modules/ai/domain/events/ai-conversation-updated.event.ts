import type { AIConversationServerDTO } from '../../aggregates/ai-conversation-server';

export interface AIConversationUpdatedEvent {
  identityId: string;
  conversation: AIConversationServerDTO;
  changes: string[];
}
