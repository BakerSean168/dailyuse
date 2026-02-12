/**
 * SQLite AIConversation Repository Implementation
 * AI 瀵硅瘽鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { AIConversation } from '../../domain-server/aggregates/ai-conversation';
import type { IAIConversationRepository, AIConversationQueryOptions } from '../../domain-server/repositories/IAIConversationRepository';

export class SqliteAIConversationRepository implements IAIConversationRepository {
  constructor(private db: Database.Database) {}

  async save(conversation: AIConversation): Promise<void> {
    const dto = conversation.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO ai_conversations (
        uuid, accountUuid, title, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.title,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE uuid = ? LIMIT 1`
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return AIConversation.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      title: row.title,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string, options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByStatus(accountUuid: string, status: string): Promise<AIConversation[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE accountUuid = ? AND status = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_conversations WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async findRecent(accountUuid: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const limitVal = Math.min(limit, 100);
    const offsetVal = offset || 0;
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE accountUuid = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(accountUuid, limitVal, offsetVal) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ai_conversations WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

