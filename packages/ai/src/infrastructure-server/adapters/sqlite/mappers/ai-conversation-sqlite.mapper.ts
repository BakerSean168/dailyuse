import { AIConversation } from '../../../../domain-server/aggregates/ai-conversation';
import { Message } from '../../../../domain-server/entities/message';
import { AiConversationId } from '../../../../domain-shared/value-objects/ai-conversation-id';
import { AiMessageId } from '../../../../domain-shared/value-objects/ai-message-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export class AiConversationSqliteMapper {
  static toDomain(row: any, messages: Message[]): AIConversation {
    return AIConversation.load({
      id: AiConversationId.of(row.id),
      identityId: IdentityId.of(row.identity_id),
      name: row.name,
      status: row.status,
      messageCount: row.message_count ?? 0,
      lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      messages,
    });
  }

  static toMessageDomain(row: any): Message {
    let tokenCount: number | null = null;
    if (row.token_usage) {
      try {
        const parsed = JSON.parse(row.token_usage);
        tokenCount = typeof parsed?.totalTokens === 'number' ? parsed.totalTokens : null;
      } catch {
        tokenCount = null;
      }
    }

    return Message.load({
      id: AiMessageId.of(row.id),
      conversationId: AiConversationId.of(row.conversation_id),
      role: row.role,
      content: row.content,
      tokenCount,
      version: 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
      deletedAt: null,
    });
  }
}
