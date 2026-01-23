/**
 * SQLite AIGenerationTask Repository Implementation
 * AI 生成任务的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import type { IAIGenerationTaskRepository, AIGenerationTaskServerDTO, TaskStatus } from '@dailyuse/domain-server/ai';
import { GenerationTaskType } from '@dailyuse/contracts/ai';

export class SqliteAIGenerationTaskRepository implements IAIGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_generation_tasks (
        uuid, account_uuid, task_type, status, input_data, output_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        output_data = excluded.output_data,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      task.uuid,
      task.account_uuid,
      task.task_type,
      task.status,
      task.input_data ? JSON.stringify(task.input_data) : null,
      task.output_data ? JSON.stringify(task.output_data) : null,
      new Date(task.created_at).getTime(),
      new Date(task.updated_at).getTime(),
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
      `SELECT * FROM ai_generation_tasks WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByTaskType(
    accountUuid: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE account_uuid = ? AND task_type = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid, taskType) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async findByStatus(accountUuid: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_generation_tasks WHERE account_uuid = ? AND status = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) => this.rowToDTO(row));
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_generation_tasks WHERE uuid = ?`);
    stmt.run(uuid);
  }

  private rowToDTO(row: any): AIGenerationTaskServerDTO {
    return {
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      task_type: row.task_type,
      status: row.status,
      input_data: row.input_data ? JSON.parse(row.input_data) : undefined,
      output_data: row.output_data ? JSON.parse(row.output_data) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
