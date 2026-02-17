/**
 * SQLite AIConversation Repository Implementation
 * AI 瀵硅瘽鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import type { IAIConversationRepository, AIConversationQueryOptions } from '../../../domain-server/repositories/IAIConversationRepository';
import type { AIConversationPersistenceDTO, MessagePersistenceDTO, ConversationStatus } from '@dailyuse/contracts/ai';

export class SqliteAIConversationRepository implements IAIConversationRepository {
  constructor(private db: Database.Database) {}

  async save(conversation: AIConversation): Promise<void> {
    const data = conversation.toPersistenceDTO();

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
      String(data.id),
      String(data.identityId),
      data.name,
      data.status,
      data.messageCount,
      data.lastMessageAt ? data.lastMessageAt.getTime() : null,
      data.version,
      data.createdAt.getTime(),
      data.updatedAt.getTime(),
      data.deletedAt ? data.deletedAt.getTime() : null,
    );

    if (data.messages) {
      this.db.prepare(`DELETE FROM ai_messages WHERE conversation_id = ?`).run(String(data.id));

      if (data.messages.length > 0) {
        const insertMessage = this.db.prepare(`
          INSERT INTO ai_messages (
            id, conversation_id, role, content, token_usage, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const transaction = this.db.transaction((messages: MessagePersistenceDTO[]) => {
          for (const message of messages) {
            insertMessage.run(
              String(message.id),
              String(message.conversationId),
              message.role,
              message.content,
              message.tokenCount != null ? JSON.stringify({ totalTokens: message.tokenCount }) : null,
              message.createdAt.getTime(),
            );
          }
        });

        transaction(data.messages);
      }
    }
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const row = this.db
      .prepare(`
        SELECT * FROM ai_conversations
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
      `)
      .get(id) as any;

    if (!row) {
      return null;
    }

    const messages = options?.includeChildren ? this.loadMessages(row.id) : null;
    return AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, messages));
  }

  async findByIdentityId(identityId: string, options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    const rows = this.db
      .prepare(`
        SELECT * FROM ai_conversations
        WHERE identity_id = ? AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `)
      .all(identityId) as any[];

    return rows.map((row) => {
      const messages = options?.includeChildren ? this.loadMessages(row.id) : null;
      return AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, messages));
    });
  }

  async findByStatus(
    identityId: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = this.db
      .prepare(`
        SELECT * FROM ai_conversations
        WHERE identity_id = ? AND status = ? AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `)
      .all(identityId, status) as any[];

    return rows.map((row) => {
      const messages = options?.includeChildren ? this.loadMessages(row.id) : null;
      return AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, messages));
    });
  }

  async delete(id: string): Promise<void> {
    this.db
      .prepare(`
        UPDATE ai_conversations
        SET status = ?, deleted_at = ?, updated_at = ?
        WHERE id = ?
      `)
      .run('Archived', Date.now(), Date.now(), id);
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const rows = this.db
      .prepare(`
        SELECT * FROM ai_conversations
        WHERE identity_id = ? AND deleted_at IS NULL
        ORDER BY COALESCE(last_message_at, updated_at) DESC
        LIMIT ? OFFSET ?
      `)
      .all(identityId, Math.max(1, limit), Math.max(0, offset ?? 0)) as any[];

    return rows.map((row) => AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, null)));
  }

  async exists(id: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM ai_conversations WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
      .get(id);

    return row !== undefined;
  }

  private loadMessages(conversationId: string): MessagePersistenceDTO[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM ai_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `)
      .all(conversationId) as any[];

    return rows.map((row) => {
      let tokenCount: number | null = null;
      if (row.token_usage) {
        try {
          const parsed = JSON.parse(row.token_usage);
          tokenCount = typeof parsed?.totalTokens === 'number' ? parsed.totalTokens : null;
        } catch {
          tokenCount = null;
        }
      }

      return {
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role,
        content: row.content,
        tokenCount,
        createdAt: new Date(row.created_at),
      };
    });
  }

  private toPersistenceDTO(row: any, messages: MessagePersistenceDTO[] | null): AIConversationPersistenceDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      status: row.status,
      messageCount: row.message_count ?? 0,
      lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      messages,
    };
  }
}

