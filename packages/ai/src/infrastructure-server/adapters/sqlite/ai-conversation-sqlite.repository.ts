/**
 * SQLite AIConversation Repository Implementation
 * AI 瀵硅瘽鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import type { IAIConversationRepository, AIConversationQueryOptions } from '../../../domain-server/repositories/IAIConversationRepository';

export class SqliteAIConversationRepository implements IAIConversationRepository {
  constructor(private db: Database.Database) {}

  async save(conversation: AIConversation): Promise<void> {
    const dto = conversation.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO ai_conversations (
        id, identityId, title, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.title,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE id = ? LIMIT 1`
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    return AIConversation.fromPersistenceDTO({
      id: row.id,
      identity_id: row.identityId,
      title: row.title,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountId(identityId: string, options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE identityId = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        id: row.id,
        identity_id: row.identityId,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByStatus(identityId: string, status: string): Promise<AIConversation[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE identityId = ? AND status = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        id: row.id,
        identity_id: row.identityId,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_conversations WHERE id = ?`);
    stmt.run(id);
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const limitVal = Math.min(limit, 100);
    const offsetVal = offset || 0;
    const stmt = this.db.prepare(
      `SELECT * FROM ai_conversations WHERE identityId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(identityId, limitVal, offsetVal) as any[];

    return rows.map((row) =>
      AIConversation.fromPersistenceDTO({
        id: row.id,
        identity_id: row.identityId,
        title: row.title,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ai_conversations WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }
}

