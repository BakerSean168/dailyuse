/**
 * SQLite KnowledgeGenerationTask Repository Implementation
 * 鐭ヨ瘑鐢熸垚浠诲姟鐨?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import { KnowledgeGenerationTask } from '../../domain-server/entities/knowledge-generation-task';
import type { IKnowledgeGenerationTaskRepository } from '../../domain-server/repositories/IKnowledgeGenerationTaskRepository';

export class SqliteKnowledgeGenerationTaskRepository implements IKnowledgeGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_generation_tasks (
        id, identityId, title, description, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.title,
      dto.description || null,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
    );

    return task;
  }

  async findById(id: string): Promise<KnowledgeGenerationTask | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE id = ? LIMIT 1`
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    return KnowledgeGenerationTask.fromPersistenceDTO({
      id: row.id,
      identity_id: row.identityId,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountId(identityId: string): Promise<KnowledgeGenerationTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE identityId = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      KnowledgeGenerationTask.fromPersistenceDTO({
        id: row.id,
        identity_id: row.identityId,
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
      WHERE id = ?
    `);

    stmt.run(
      dto.title,
      dto.description || null,
      dto.status,
      dto.updatedAt,
      dto.id,
    );

    return task;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM knowledge_generation_tasks WHERE id = ?`);
    stmt.run(id);
  }
}

