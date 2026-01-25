/**
 * SQLite AIGenerationTask Repository Implementation
 * AI 鐢熸垚浠诲姟鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import type { IAIGenerationTaskRepository, AIGenerationTaskServerDTO, TaskStatus } from '@dailyuse/domain-server/ai';
import { GenerationTaskType } from '@dailyuse/contracts/ai';

export class SqliteAIGenerationTaskRepository implements IAIGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_generation_tasks (
        uuid, accountUuid, task_type, status, input_data, output_data,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        output_data = excluded.output_data,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      task.uuid,
      task.accountUuid,
      task.task_type,
      task.status,
      task.input_data ? JSON.stringify(task.input_data) : null,
      task.output_data ? JSON.stringify(task.output_data) : null,
      new Date(task.createdAt).getTime(),
      new Date(task.updatedAt).getTime(),
    );
  }

  async findByUuid(uuid: string): Promise<AIGenerationTaskServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE uuid = ? LIMIT 1`
    );
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountUuid(accountUuid: string): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByTaskType(
    accountUuid: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE accountUuid = ? AND task_type = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid, taskType) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByStatus(accountUuid: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE accountUuid = ? AND status = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_generation_tasks WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async findRecent(accountUuid: string, limit: number, offset?: number): Promise<AIGenerationTaskServerDTO[]> {
    const limitVal = Math.min(limit, 100);
    const offsetVal = offset || 0;
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE accountUuid = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(accountUuid, limitVal, offsetVal) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM ai_generation_tasks WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }

  private rowToDTO(row: any): AIGenerationTaskServerDTO {
    return {
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      task_type: row.task_type,
      status: row.status,
      input_data: row.input_data ? JSON.parse(row.input_data) : undefined,
      output_data: row.output_data ? JSON.parse(row.output_data) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

