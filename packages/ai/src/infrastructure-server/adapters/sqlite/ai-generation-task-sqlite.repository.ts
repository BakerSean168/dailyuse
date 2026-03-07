/**
 * SQLite AIGenerationTask Repository Implementation
 */

import type Database from 'better-sqlite3';
import type { IAIGenerationTaskRepository } from '../../../domain-server/repositories/IAIGenerationTaskRepository';
import type {
  GenerationTaskType,
  AIGenerationTaskServerDTO,
  TaskStatus,
} from '@dailyuse/contracts/ai';
import { AiGenerationTaskSqliteMapper } from './mappers/ai-generation-task-sqlite.mapper';

export class SqliteAIGenerationTaskRepository implements IAIGenerationTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    const inputPayload = {
      data: task.input,
      meta: {
        conversationId: task.conversationId,
        provider: task.provider,
        model: task.model,
        maxRetries: task.maxRetries,
        processingStartedAt: task.processingStartedAt,
      },
    };

    const stmt = this.db.prepare(`
      INSERT INTO ai_generation_tasks (
        id, identity_id, task_type, status, input_data, output_data,
        error_message, retry_count, token_usage, processing_ms, completed_at,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        task_type = excluded.task_type,
        status = excluded.status,
        input_data = excluded.input_data,
        output_data = excluded.output_data,
        error_message = excluded.error_message,
        retry_count = excluded.retry_count,
        token_usage = excluded.token_usage,
        processing_ms = excluded.processing_ms,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    const processingMs =
      task.processingStartedAt && task.processingCompletedAt
        ? Math.max(0, task.processingCompletedAt - task.processingStartedAt)
        : null;

    stmt.run(
      String(task.id),
      String(task.identityId),
      task.type,
      task.status,
      JSON.stringify(inputPayload),
      task.result ? JSON.stringify(task.result) : null,
      task.errorMessage,
      task.retryCount,
      task.tokenUsage ? JSON.stringify(task.tokenUsage) : null,
      processingMs,
      task.processingCompletedAt ?? null,
      task.createdAt,
      task.updatedAt,
      null,
    );
  }

  async findById(id: string): Promise<AIGenerationTaskServerDTO | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_generation_tasks
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return AiGenerationTaskSqliteMapper.toDTO(row);
  }

  async findByIdentityId(identityId: string): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_generation_tasks
      WHERE identity_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => AiGenerationTaskSqliteMapper.toDTO(row));
  }

  async findByTaskType(
    identityId: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_generation_tasks
      WHERE identity_id = ? AND task_type = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(identityId, taskType) as any[];

    return rows.map((row) => AiGenerationTaskSqliteMapper.toDTO(row));
  }

  async findByStatus(identityId: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_generation_tasks
      WHERE identity_id = ? AND status = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) => AiGenerationTaskSqliteMapper.toDTO(row));
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`UPDATE ai_generation_tasks SET deleted_at = ? WHERE id = ?`);
    stmt.run(Date.now(), id);
  }

  async findRecent(
    identityId: string,
    limit: number,
    offset?: number,
  ): Promise<AIGenerationTaskServerDTO[]> {
    const limitVal = Math.max(1, limit);
    const offsetVal = Math.max(0, offset || 0);
    const stmt = this.db.prepare(`
      SELECT * FROM ai_generation_tasks
      WHERE identity_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(identityId, limitVal, offsetVal) as any[];

    return rows.map((row) => AiGenerationTaskSqliteMapper.toDTO(row));
  }

  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM ai_generation_tasks
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `);
    return stmt.get(id) !== undefined;
  }
}
