import type { ConversationStatus } from '@dailyuse/contracts/ai';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AIConversation } from '../../../../domain-server/aggregates/ai-conversation';
import { Message } from '../../../../domain-server/entities/message';
import { AiConversationId } from '../../../../domain-shared/value-objects/ai-conversation-id';
import { AiMessageId } from '../../../../domain-shared/value-objects/ai-message-id';

export interface PowerSyncAIConversationRow {
  id: string;
  identity_id: string;
  name: string;
  status: string;
  message_count: number | null;
  last_message_at: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PowerSyncAIMessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  token_usage: string | null;
  created_at: string;
}

export interface PowerSyncAIConversationWriteRow {
  id: string;
  identity_id: string;
  name: string;
  status: string;
  message_count: number;
  last_message_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PowerSyncAIMessageWriteRow {
  id: string;
  identity_id: string;
  conversation_id: string;
  role: string;
  content: string;
  token_usage: string | null;
  created_at: string;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeConversationStatus(status: string): ConversationStatus {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'ARCHIVED') return 'Archived';
  return status as ConversationStatus;
}

function normalizeRole(role: string): Message['role'] {
  if (role === 'USER') return 'User';
  if (role === 'ASSISTANT') return 'Assistant';
  if (role === 'SYSTEM') return 'System';
  return role as Message['role'];
}

export class PowerSyncAIConversationMapper {
  static toDomain(row: PowerSyncAIConversationRow, messages: Message[]): AIConversation {
    const createdAt = toDate(row.created_at) ?? new Date();
    const updatedAt = toDate(row.updated_at) ?? createdAt;

    return AIConversation.load({
      id: AiConversationId.of(row.id),
      identityId: IdentityId.of(row.identity_id),
      name: row.name,
      status: normalizeConversationStatus(row.status),
      messageCount: row.message_count ?? 0,
      lastMessageAt: toDate(row.last_message_at),
      version: row.version ?? 1,
      createdAt,
      updatedAt,
      deletedAt: toDate(row.deleted_at),
      messages,
    });
  }

  static toMessageDomain(row: PowerSyncAIMessageRow): Message {
    let tokenCount: number | null = null;
    if (row.token_usage) {
      try {
        const parsed = JSON.parse(row.token_usage);
        if (typeof parsed === 'number') {
          tokenCount = parsed;
        } else if (typeof parsed?.tokenCount === 'number') {
          tokenCount = parsed.tokenCount;
        } else if (typeof parsed?.totalTokens === 'number') {
          tokenCount = parsed.totalTokens;
        }
      } catch {
        tokenCount = null;
      }
    }

    const createdAt = toDate(row.created_at) ?? new Date();

    return Message.load({
      id: AiMessageId.of(row.id),
      conversationId: AiConversationId.of(row.conversation_id),
      role: normalizeRole(row.role),
      content: row.content,
      tokenCount,
      version: 1,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    });
  }

  static toPersistence(conversation: AIConversation): PowerSyncAIConversationWriteRow {
    const dto = conversation.toServerDTO(true);
    return {
      id: String(dto.id),
      identity_id: String(dto.identityId),
      name: dto.name,
      status: dto.status,
      message_count: dto.messageCount,
      last_message_at: dto.lastMessageAt ? new Date(dto.lastMessageAt).toISOString() : null,
      version: dto.version,
      created_at: new Date(dto.createdAt).toISOString(),
      updated_at: new Date(dto.updatedAt).toISOString(),
      deleted_at: dto.deletedAt ? new Date(dto.deletedAt).toISOString() : null,
    };
  }

  static toMessagePersistence(conversation: AIConversation): PowerSyncAIMessageWriteRow[] {
    const dto = conversation.toServerDTO(true);
    if (!dto.messages) {
      return [];
    }

    return dto.messages.map((message) => ({
      id: String(message.id),
      identity_id: String(dto.identityId),
      conversation_id: String(message.conversationId),
      role: message.role,
      content: message.content,
      token_usage:
        message.tokenCount != null ? JSON.stringify({ totalTokens: message.tokenCount }) : null,
      created_at: new Date(message.createdAt).toISOString(),
    }));
  }
}
