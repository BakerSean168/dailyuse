/**
 * SQLite AIGenerationTask Repository Implementation
 * AI 鐢熸垚浠诲姟�?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import type { IAIGenerationTaskRepository, AIGenerationTaskServerDTO, TaskStatus } from '../../../domain-server/repositories/IAIGenerationTaskRepository';
import { GenerationTaskType } from '@dailyuse/contracts/ai';

export class SqliteAIGenerationTaskRepository implements IAIGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_generation_tasks (
        id, identityId, task_type, status, input_data, output_data,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        output_data = excluded.output_data,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      task.id,
      task.identityId,
      task.task_type,
      task.status,
      task.input_data ? JSON.stringify(task.input_data) : null,
      task.output_data ? JSON.stringify(task.output_data) : null,
      new Date(task.createdAt).getTime(),
      new Date(task.updatedAt).getTime(),
    );
  }

  async findById(id: string): Promise<AIGenerationTaskServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE id = ? LIMIT 1`
    );
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountId(identityId: string): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE identityId = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByTaskType(
    identityId: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE identityId = ? AND task_type = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId, taskType) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByStatus(identityId: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE identityId = ? AND status = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_generation_tasks WHERE id = ?`);
    stmt.run(id);
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIGenerationTaskServerDTO[]> {
    const limitVal = Math.min(limit, 100);
    const offsetVal = offset || 0;
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE identityId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(identityId, limitVal, offsetVal) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ai_generation_tasks WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }

  private rowToDTO(row: any): AIGenerationTaskServerDTO {
    return {
      id: row.id,
      identity_id: row.identityId,
      task_type: row.task_type,
      status: row.status,
      input_data: row.input_data ? JSON.parse(row.input_data) : undefined,
      output_data: row.output_data ? JSON.parse(row.output_data) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

