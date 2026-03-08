/**
 * AI Conversation List DTOs
 */

import type { AIConversationClientDTO } from '../aggregates/ai-conversation-client';

export interface ConversationListDTO {
  conversations: AIConversationClientDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
