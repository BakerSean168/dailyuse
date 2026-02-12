/**
 * SQLite KnowledgeGenerationTask Repository Implementation
 * 鐭ヨ瘑鐢熸垚浠诲姟鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { KnowledgeGenerationTask } from '../../../domain-server/entities/knowledge-generation-task';
import type { IKnowledgeGenerationTaskRepository } from '../../../domain-server/repositories/IKnowledgeGenerationTaskRepository';

export class SqliteKnowledgeGenerationTaskRepository implements IKnowledgeGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_generation_tasks (
        uuid, accountUuid, title, description, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.title,
      dto.description || null,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
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
      account_uuid: row.accountUuid,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<KnowledgeGenerationTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      KnowledgeGenerationTask.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async update(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      UPDATE knowledge_generation_tasks
      SET title = ?, description = ?, status = ?, updatedAt = ?
      WHERE uuid = ?
    `);

    stmt.run(
      dto.title,
      dto.description || null,
      dto.status,
      dto.updatedAt,
      dto.uuid,
    );

    return task;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM knowledge_generation_tasks WHERE uuid = ?`);
    stmt.run(uuid);
  }
}

