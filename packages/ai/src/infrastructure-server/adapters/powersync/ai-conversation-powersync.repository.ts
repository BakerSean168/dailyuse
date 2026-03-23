import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { ConversationStatus } from '@dailyuse/contracts/ai';
import { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import { Message } from '../../../domain-server/entities/message';
import type {
  AIConversationQueryOptions,
  IAIConversationRepository,
} from '../../../domain-server/repositories/IAIConversationRepository';
import { eventBus } from '@dailyuse/utils';
import {
  PowerSyncAIConversationMapper,
  type PowerSyncAIConversationRow,
  type PowerSyncAIMessageRow,
} from './mappers';

const untypedEventBus = eventBus as unknown as {
  send(eventType: string, payload: unknown): void;
};

export class PowerSyncAIConversationRepository implements IAIConversationRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(conversation: AIConversation): Promise<void> {
    const persisted = PowerSyncAIConversationMapper.toPersistence(conversation);

    await this.db.writeTransaction(async (tx) => {
      const existing = await tx.getOptional<{ id: string }>(
        `SELECT id FROM ai_conversations WHERE id = ? LIMIT 1`,
        [persisted.id],
      );

      if (existing) {
        await tx.execute(
          `UPDATE ai_conversations
           SET identity_id = ?,
               name = ?,
               status = ?,
               message_count = ?,
               last_message_at = ?,
               version = ?,
               updated_at = ?,
               deleted_at = ?
           WHERE id = ?`,
          [
            persisted.identity_id,
            persisted.name,
            persisted.status,
            persisted.message_count,
            persisted.last_message_at,
            persisted.version,
            persisted.updated_at,
            persisted.deleted_at,
            persisted.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO ai_conversations (
             id, identity_id, name, status, message_count, last_message_at, version,
             created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            persisted.id,
            persisted.identity_id,
            persisted.name,
            persisted.status,
            persisted.message_count,
            persisted.last_message_at,
            persisted.version,
            persisted.created_at,
            persisted.updated_at,
            persisted.deleted_at,
          ],
        );
      }

      const messages = PowerSyncAIConversationMapper.toMessagePersistence(conversation);
      await tx.execute(`DELETE FROM ai_messages WHERE conversation_id = ?`, [persisted.id]);
      for (const message of messages) {
        await tx.execute(
          `INSERT INTO ai_messages (
             id, identity_id, conversation_id, role, content, token_usage, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            message.id,
            message.identity_id,
            message.conversation_id,
            message.role,
            message.content,
            message.token_usage,
            message.created_at,
          ],
        );
      }
    });

    for (const event of conversation.pullDomainEvents()) {
      untypedEventBus.send(event.eventType, event.payload);
    }
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const row = await this.db.getOptional<PowerSyncAIConversationRow>(
      `SELECT * FROM ai_conversations WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );

    if (!row) {
      return null;
    }

    const messages = options?.includeChildren ? await this.loadMessages(row.id) : [];
    return PowerSyncAIConversationMapper.toDomain(row, messages);
  }

  async findByIdentityId(
    identityId: string,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = await this.db.getAll<PowerSyncAIConversationRow>(
      `SELECT * FROM ai_conversations WHERE identity_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [identityId],
    );

    if (!options?.includeChildren) {
      return rows.map((row) => PowerSyncAIConversationMapper.toDomain(row, []));
    }

    const messagesByConversationId = await this.loadMessagesByConversationIds(
      rows.map((r) => r.id),
    );
    return rows.map((row) =>
      PowerSyncAIConversationMapper.toDomain(row, messagesByConversationId.get(row.id) ?? []),
    );
  }

  async findByStatus(
    identityId: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = await this.db.getAll<PowerSyncAIConversationRow>(
      `SELECT * FROM ai_conversations
       WHERE identity_id = ? AND status = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [identityId, status],
    );

    if (!options?.includeChildren) {
      return rows.map((row) => PowerSyncAIConversationMapper.toDomain(row, []));
    }

    const messagesByConversationId = await this.loadMessagesByConversationIds(
      rows.map((r) => r.id),
    );
    return rows.map((row) =>
      PowerSyncAIConversationMapper.toDomain(row, messagesByConversationId.get(row.id) ?? []),
    );
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const rows = await this.db.getAll<PowerSyncAIConversationRow>(
      `SELECT * FROM ai_conversations
       WHERE identity_id = ? AND deleted_at IS NULL
       ORDER BY COALESCE(last_message_at, updated_at) DESC
       LIMIT ? OFFSET ?`,
      [identityId, Math.max(1, limit), Math.max(0, offset ?? 0)],
    );
    return rows.map((row) => PowerSyncAIConversationMapper.toDomain(row, []));
  }

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE ai_conversations SET status = ?, deleted_at = ?, updated_at = ? WHERE id = ?`,
      ['Archived', now, now, id],
    );
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ one: number }>(
      `SELECT 1 as one FROM ai_conversations WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return row !== null;
  }

  private async loadMessages(conversationId: string): Promise<Message[]> {
    const rows = await this.db.getAll<PowerSyncAIMessageRow>(
      `SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId],
    );
    return rows.map((row) => PowerSyncAIConversationMapper.toMessageDomain(row));
  }

  private async loadMessagesByConversationIds(
    conversationIds: string[],
  ): Promise<Map<string, Message[]>> {
    const result = new Map<string, Message[]>();
    if (conversationIds.length === 0) {
      return result;
    }

    for (const conversationId of conversationIds) {
      result.set(conversationId, await this.loadMessages(conversationId));
    }
    return result;
  }
}
