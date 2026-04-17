import type { AIConversationServerDTO } from '../../aggregates/ai-conversation-server';
import type { ConversationStatus } from '../../value-objects/conversation-status';

export interface AIConversationStatusChangedEvent {
  identityId: string;
  conversation: AIConversationServerDTO;
  oldStatus: ConversationStatus;
  newStatus: ConversationStatus;
}
