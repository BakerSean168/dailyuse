/**
 * SQLite ScheduleTask Repository Implementation
 */

import type Database from 'better-sqlite3';
import { ScheduleTask } from '../../../domain-server/aggregates/schedule-task';
import type { ScheduleTaskState } from '../../../domain-server/aggregates/schedule-task';
import type {
  IScheduleTaskRepository,
  IScheduleTaskQueryOptions,
} from '../../../domain-server/repositories/IScheduleTaskRepository';
import { ScheduleTaskStatus, SourceModule, type ExecutionStatus } from '@dailyuse/contracts/schedule';
import { ScheduleTaskId } from '../../../domain-shared/value-objects/schedule-task-id';
import { ScheduleConfig } from '../../../domain-server/value-objects/ScheduleConfig';
import { ExecutionInfo } from '../../../domain-server/value-objects/ExecutionInfo';
import { RetryPolicy } from '../../../domain-server/value-objects/RetryPolicy';
import { TaskMetadata } from '../../../domain-server/value-objects/TaskMetadata';

export class SqliteScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: ScheduleTask): Promise<void> {
    const metadataDTO = task.metadata.toServerDTO();

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
      task.id,
      task.identityId,
      task.name,
      task.description,
      task.sourceModule,
      task.sourceEntityId,
      task.status,
      task.enabled ? 1 : 0,
      task.schedule.cronExpression,
      task.schedule.timezone,
      task.schedule.startDate !== null ? new Date(task.schedule.startDate) : null,
      task.schedule.endDate !== null ? new Date(task.schedule.endDate) : null,
      task.schedule.maxExecutions,
      task.execution.nextRunAt !== null ? new Date(task.execution.nextRunAt) : null,
      task.execution.lastRunAt !== null ? new Date(task.execution.lastRunAt) : null,
      task.execution.executionCount,
      task.execution.lastExecutionStatus ? String(task.execution.lastExecutionStatus) : null,
      task.execution.lastExecutionDuration,
      task.execution.consecutiveFailures,
      task.retryPolicy.maxRetries,
      task.retryPolicy.retryDelay,
      task.retryPolicy.maxRetryDelay,
      task.retryPolicy.backoffMultiplier,
      '[]',
      typeof metadataDTO.payload === 'string' ? metadataDTO.payload : JSON.stringify(metadataDTO.payload),
      JSON.stringify(metadataDTO.tags),
      metadataDTO.priority,
      metadataDTO.timeout,
      task.createdAt,
      task.updatedAt,
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
    const state: ScheduleTaskState = {
      id: ScheduleTaskId.of(row.id),
      identityId: row.identity_id,
      name: row.name,
      description: row.description,
      sourceModule: row.source_module as SourceModule,
      sourceEntityId: row.source_entity_id,
      status: row.status as ScheduleTaskStatus,
      enabled: row.enabled === 1,
      schedule: ScheduleConfig.fromPersistenceDTO({
        cronExpression: row.cron_expression ?? null,
        timezone: row.timezone,
        startDate: row.start_date ?? null,
        endDate: row.end_date ?? null,
        maxExecutions: row.max_executions ?? null,
      }),
      execution: ExecutionInfo.fromPersistenceDTO({
        nextRunAt: row.next_run_at,
        lastRunAt: row.last_run_at,
        executionCount: row.execution_count,
        lastExecutionStatus: (row.last_execution_status as ExecutionStatus) ?? null,
        last_execution_duration: row.last_execution_duration ?? null,
        consecutive_failures: row.consecutive_failures ?? 0,
      }),
      retryPolicy: RetryPolicy.fromPersistenceDTO({
        enabled: row.enabled === 1,
        maxRetries: row.max_retries,
        retry_delay: row.initial_delay_ms ?? 0,
        backoff_multiplier: row.backoff_multiplier ?? 1,
        max_retry_delay: row.max_delay_ms ?? 0,
      }),
      metadata: TaskMetadata.fromPersistenceDTO({
        payload: row.payload ?? {},
        tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
        priority: row.priority,
        timeout: row.timeout,
      }),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      version: row.version ?? 1,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
    return ScheduleTask.load(state);
  }
}
