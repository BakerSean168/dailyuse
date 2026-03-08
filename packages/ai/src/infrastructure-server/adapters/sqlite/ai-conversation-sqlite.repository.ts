/**
 * SQLite AIConversation Repository Implementation
 */

import type Database from 'better-sqlite3';
import { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import { Message } from '../../../domain-server/entities/message';
import type {
  IAIConversationRepository,
  AIConversationQueryOptions,
} from '../../../domain-server/repositories/IAIConversationRepository';
import type { ConversationStatus } from '@dailyuse/contracts/ai';
import { AiConversationSqliteMapper } from './mappers/ai-conversation-sqlite.mapper';

export class SqliteAIConversationRepository implements IAIConversationRepository {
  constructor(private db: Database.Database) {}

  async save(conversation: AIConversation): Promise<void> {
    const dto = conversation.toServerDTO(true);

    const stmt = this.db.prepare(`
      INSERT INTO ai_conversations (
        id, identity_id, name, status, message_count, last_message_at, version,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        status = excluded.status,
        message_count = excluded.message_count,
        last_message_at = excluded.last_message_at,
        version = excluded.version,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    stmt.run(
      String(dto.id),
      String(dto.identityId),
      dto.name,
      dto.status,
      dto.messageCount,
      dto.lastMessageAt,
      dto.version,
      dto.createdAt,
      dto.updatedAt,
      dto.deletedAt,
    );

    if (dto.messages) {
      this.db.prepare(`DELETE FROM ai_messages WHERE conversation_id = ?`).run(String(dto.id));

      if (dto.messages.length > 0) {
        const insertMessage = this.db.prepare(`
          INSERT INTO ai_messages (
            id, identity_id, conversation_id, role, content, token_usage, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = this.db.transaction((messages: NonNullable<typeof dto.messages>) => {
          for (const message of messages) {
            insertMessage.run(
              String(message.id),
              String(dto.identityId),
              String(message.conversationId),
              message.role,
              message.content,
              message.tokenCount != null
                ? JSON.stringify({ totalTokens: message.tokenCount })
                : null,
              message.createdAt,
            );
          }
        });

        transaction(dto.messages);
      }
    }
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const row = this.db
      .prepare(
        `
        SELECT * FROM ai_conversations
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(id) as any;

    if (!row) {
      return null;
    }

    const messages = options?.includeChildren ? this.loadMessages(row.id) : [];
    return AiConversationSqliteMapper.toDomain(row, messages);
  }

  async findByIdentityId(
    identityId: string,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = this.db
      .prepare(
        `
        SELECT * FROM ai_conversations
        WHERE identity_id = ? AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `,
      )
      .all(identityId) as any[];

    return rows.map((row) => {
      const messages = options?.includeChildren ? this.loadMessages(row.id) : [];
      return AiConversationSqliteMapper.toDomain(row, messages);
    });
  }

  async findByStatus(
    identityId: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = this.db
      .prepare(
        `
        SELECT * FROM ai_conversations
        WHERE identity_id = ? AND status = ? AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `,
      )
      .all(identityId, status) as any[];

    return rows.map((row) => {
      const messages = options?.includeChildren ? this.loadMessages(row.id) : [];
      return AiConversationSqliteMapper.toDomain(row, messages);
    });
  }

  async delete(id: string): Promise<void> {
    this.db
      .prepare(
        `
        UPDATE ai_conversations
        SET status = ?, deleted_at = ?, updated_at = ?
        WHERE id = ?
      `,
      )
      .run('Archived', Date.now(), Date.now(), id);
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const rows = this.db
      .prepare(
        `
        SELECT * FROM ai_conversations
        WHERE identity_id = ? AND deleted_at IS NULL
        ORDER BY COALESCE(last_message_at, updated_at) DESC
        LIMIT ? OFFSET ?
      `,
      )
      .all(identityId, Math.max(1, limit), Math.max(0, offset ?? 0)) as any[];

    return rows.map((row) => AiConversationSqliteMapper.toDomain(row, []));
  }

  async exists(id: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM ai_conversations WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
      .get(id);

    return row !== undefined;
  }

  private loadMessages(conversationId: string): Message[] {
    const rows = this.db
      .prepare(
        `
        SELECT * FROM ai_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `,
      )
      .all(conversationId) as any[];

    return rows.map((row) => AiConversationSqliteMapper.toMessageDomain(row));
  }
}
