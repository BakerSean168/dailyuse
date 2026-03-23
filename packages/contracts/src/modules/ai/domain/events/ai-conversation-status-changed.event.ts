import type { AIConversationServerDTO } from '../../aggregates';
import type { ConversationStatus } from '../../value-objects';

export interface AIConversationStatusChangedEvent {
  identityId: string;
  conversation: AIConversationServerDTO;
  oldStatus: ConversationStatus;
  newStatus: ConversationStatus;
}
