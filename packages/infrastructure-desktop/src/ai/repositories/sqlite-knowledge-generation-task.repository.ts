/**
 * SQLite KnowledgeGenerationTask Repository Implementation
 * 知识生成任务的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { KnowledgeGenerationTask } from '@dailyuse/domain-server/ai';
import type { IKnowledgeGenerationTaskRepository } from '@dailyuse/domain-server/ai';

export class SqliteKnowledgeGenerationTaskRepository implements IKnowledgeGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_generation_tasks (
        uuid, account_uuid, title, description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.title,
      dto.description || null,
      dto.status,
      dto.created_at,
      dto.updated_at,
    );

    return task;
  }

  async findByUuid(uuid: string): Promise<KnowledgeGenerationTask | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE uuid = ? LIMIT 1`
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return KnowledgeGenerationTask.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      title: row.title,
      description: row.description,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<KnowledgeGenerationTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      KnowledgeGenerationTask.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        title: row.title,
        description: row.description,
        status: row.status,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async update(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      UPDATE knowledge_generation_tasks
      SET title = ?, description = ?, status = ?, updated_at = ?
      WHERE uuid = ?
    `);

    stmt.run(
      dto.title,
      dto.description || null,
      dto.status,
      dto.updated_at,
      dto.uuid,
    );

    return task;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM knowledge_generation_tasks WHERE uuid = ?`);
    stmt.run(uuid);
  }
}
