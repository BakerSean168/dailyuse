/**
 * SQLite KnowledgeGenerationTask Repository Implementation
 */

import type Database from 'better-sqlite3';
import type { KnowledgeGenerationTask } from '../../../domain-server/entities/knowledge-generation-task';
import type { IKnowledgeGenerationTaskRepository } from '../../../domain-server/repositories/IKnowledgeGenerationTaskRepository';

export class SqliteKnowledgeGenerationTaskRepository implements IKnowledgeGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const stmt = this.db.prepare(`
      INSERT INTO knowledge_generation_tasks (
        id, identity_id, topic, document_count, target_audience,
        folder_path, status, progress, generated_document_ids, error,
        created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.identityId,
      task.topic,
      task.documentCount,
      task.targetAudience || null,
      task.folderPath,
      task.status,
      task.progress,
      JSON.stringify(task.generatedDocumentIds),
      task.error || null,
      task.createdAt,
      task.completedAt || null,
    );

    return task;
  }

  async findById(id: string): Promise<KnowledgeGenerationTask | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE id = ? LIMIT 1`
    );
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.rowToEntity(row);
  }

  async findByIdentityId(identityId: string): Promise<KnowledgeGenerationTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM knowledge_generation_tasks WHERE identity_id = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(identityId) as any[];
    return rows.map((row) => this.rowToEntity(row));
  }

  async update(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask> {
    const stmt = this.db.prepare(`
      UPDATE knowledge_generation_tasks
      SET topic = ?, status = ?, progress = ?,
          generated_document_ids = ?, error = ?, completed_at = ?
      WHERE id = ?
    `);

    stmt.run(
      task.topic,
      task.status,
      task.progress,
      JSON.stringify(task.generatedDocumentIds),
      task.error || null,
      task.completedAt || null,
      task.id,
    );

    return task;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM knowledge_generation_tasks WHERE id = ?`);
    stmt.run(id);
  }

  private rowToEntity(row: any): KnowledgeGenerationTask {
    return {
      id: row.id,
      identityId: row.identity_id,
      topic: row.topic,
      documentCount: row.document_count,
      targetAudience: row.target_audience || undefined,
      folderPath: row.folder_path,
      status: row.status,
      progress: row.progress,
      generatedDocumentIds: JSON.parse(row.generated_document_ids || '[]'),
      error: row.error || undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
    };
  }
}