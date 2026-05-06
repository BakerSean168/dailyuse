import type { IdentityId, AiConversationId } from '../../../../primitives';
import type { AIConversationServerDTO } from '../../aggregates/ai-conversation-server';
import type { MessageServerDTO } from '../../entities/message-server';

export interface AIMessageAddedEvent {
  identityId: IdentityId;
  conversationId: AiConversationId;
  conversation: AIConversationServerDTO;
  message: MessageServerDTO;
}
