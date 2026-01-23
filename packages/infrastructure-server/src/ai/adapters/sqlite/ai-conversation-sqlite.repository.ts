/**
 * SQLite AIConversation Repository Implementation
 * AI 对话的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { AIConversation } from '@dailyuse/domain-server/ai';
import type { IAIConversationRepository, AIConversationQueryOptions } from '@dailyuse/domain-server/ai';

export class SqliteAIConversationRepository implements IAIConversationRepository {
  constructor(private db: Database.Database) {}

  async save(conversation: AIConversation): Promise<void> {
    const dto = conversation.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO ai_conversations (
        uuid, account_uuid, title, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.title,
      dto.status,
      dto.created_at,
      dto.updated_at,
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
      account_uuid: row.account_uuid,
      title: row.title,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string, options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        title: row.title,
        status: row.status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByStatus(accountUuid: string, status: string): Promise<AIConversation[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE account_uuid = ? AND status = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        title: row.title,
        status: row.status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_conversations WHERE uuid = ?`);
    stmt.run(uuid);
  }
}
