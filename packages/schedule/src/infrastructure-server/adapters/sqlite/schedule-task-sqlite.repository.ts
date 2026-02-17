/**
 * SQLite ScheduleTask Repository Implementation
 */

import type Database from 'better-sqlite3';
import { ScheduleTask } from '../../../domain-server/aggregates/schedule-task';
import type {
  IScheduleTaskRepository,
  IScheduleTaskQueryOptions,
} from '../../../domain-server/repositories/IScheduleTaskRepository';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';

export class SqliteScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: ScheduleTask): Promise<void> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_tasks (
        id, identity_id, name, description, source_module, source_entity_id, status,
        enabled, cron_expression, timezone, start_date, end_date, max_executions,
        next_run_at, last_run_at, execution_count, last_execution_status, last_execution_duration,
        consecutive_failures, max_retries, initial_delay_ms, max_delay_ms, backoff_multiplier,
        retryable_statuses, payload, tags, priority, timeout, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        enabled = excluded.enabled,
        next_run_at = excluded.next_run_at,
        last_run_at = excluded.last_run_at,
        execution_count = excluded.execution_count,
        last_execution_status = excluded.last_execution_status,
        last_execution_duration = excluded.last_execution_duration,
        consecutive_failures = excluded.consecutive_failures,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.name,
      dto.description,
      dto.sourceModule,
      dto.sourceEntityId,
      dto.status,
      dto.enabled ? 1 : 0,
      dto.cronExpression,
      dto.timezone,
      dto.startDate,
      dto.endDate,
      dto.maxExecutions,
      dto.nextRunAt,
      dto.lastRunAt,
      dto.executionCount,
      dto.lastExecutionStatus,
      dto.lastExecutionDuration,
      dto.consecutiveFailures,
      dto.maxRetries,
      dto.initialDelayMs,
      dto.maxDelayMs,
      dto.backoffMultiplier,
      dto.retryableStatuses,
      dto.payload,
      dto.tags,
      dto.priority,
      dto.timeout,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<ScheduleTask | null> {
    const stmt = this.db.prepare(`SELECT * FROM schedule_tasks WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToTask(row);
  }

  async deleteById(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_tasks WHERE id = ?`);
    stmt.run(id);
  }

  async findByAccountId(identityId: string): Promise<ScheduleTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_tasks WHERE identity_id = ? ORDER BY next_run_at ASC NULLS LAST`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findByIdentityId(identityId: string): Promise<ScheduleTask[]> {
    return this.findByAccountId(identityId);
  }

  async findBySourceModule(module: SourceModule, identityId?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE source_module = ?`;
    const params: any[] = [module];

    if (identityId) {
      query += ` AND identity_id = ?`;
      params.push(identityId);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findBySourceEntity(
    module: SourceModule,
    entityId: string,
    identityId?: string,
  ): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE source_module = ? AND source_entity_id = ?`;
    const params: any[] = [module, entityId];

    if (identityId) {
      query += ` AND identity_id = ?`;
      params.push(identityId);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findByStatus(status: ScheduleTaskStatus, identityId?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE status = ?`;
    const params: any[] = [status];

    if (identityId) {
      query += ` AND identity_id = ?`;
      params.push(identityId);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findEnabled(identityId?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE enabled = 1 AND status = 'ACTIVE'`;
    const params: any[] = [];

    if (identityId) {
      query += ` AND identity_id = ?`;
      params.push(identityId);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE enabled = 1 AND status IN ('ACTIVE', 'PENDING') AND next_run_at <= ? ORDER BY next_run_at ASC`;
    const params: any[] = [beforeTime.getTime()];

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE 1=1`;
    const params: any[] = [];

    if (options.identityId) {
      query += ` AND identity_id = ?`;
      params.push(options.identityId);
    }

    if (options.sourceModule) {
      query += ` AND source_module = ?`;
      params.push(options.sourceModule);
    }

    if (options.sourceEntityId) {
      query += ` AND source_entity_id = ?`;
      params.push(options.sourceEntityId);
    }

    if (options.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options.isEnabled !== undefined) {
      query += ` AND enabled = ?`;
      params.push(options.isEnabled ? 1 : 0);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async count(options: IScheduleTaskQueryOptions): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM schedule_tasks WHERE 1=1`;
    const params: any[] = [];

    if (options.identityId) {
      query += ` AND identity_id = ?`;
      params.push(options.identityId);
    }

    if (options.sourceModule) {
      query += ` AND source_module = ?`;
      params.push(options.sourceModule);
    }

    if (options.sourceEntityId) {
      query += ` AND source_entity_id = ?`;
      params.push(options.sourceEntityId);
    }

    if (options.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options.isEnabled !== undefined) {
      query += ` AND enabled = ?`;
      params.push(options.isEnabled ? 1 : 0);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;

    return result.count;
  }

  async saveBatch(tasks: ScheduleTask[]): Promise<void> {
    const transaction = this.db.transaction((items: ScheduleTask[]) => {
      for (const task of items) {
        this.save(task);
      }
    });
    transaction(tasks);
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const transaction = this.db.transaction((ids: string[]) => {
      for (const id of ids) {
        this.deleteById(id);
      }
    });
    transaction(ids);
  }

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return fn(this);
  }

  // Private helper method to convert database row to ScheduleTask
  private rowToTask(row: any): ScheduleTask {
    // Convert snake_case row properties to camelCase DTO
    return ScheduleTask.fromPersistenceDTO({
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      description: row.description,
      sourceModule: row.source_module as SourceModule,
      sourceEntityId: row.source_entity_id,
      status: row.status as ScheduleTaskStatus,
      enabled: row.enabled === 1,
      cronExpression: row.cron_expression,
      timezone: row.timezone,
      startDate: row.start_date,
      endDate: row.end_date,
      maxExecutions: row.max_executions,
      nextRunAt: row.next_run_at,
      lastRunAt: row.last_run_at,
      executionCount: row.execution_count,
      lastExecutionStatus: row.last_execution_status,
      lastExecutionDuration: row.last_execution_duration,
      consecutiveFailures: row.consecutive_failures,
      maxRetries: row.max_retries,
      initialDelayMs: row.initial_delay_ms,
      maxDelayMs: row.max_delay_ms,
      backoffMultiplier: row.backoff_multiplier,
      retryableStatuses: row.retryable_statuses,
      payload: row.payload,
      tags: row.tags,
      priority: row.priority,
      timeout: row.timeout,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
