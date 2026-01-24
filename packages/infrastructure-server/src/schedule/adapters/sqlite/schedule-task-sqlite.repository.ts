/**
 * SQLite ScheduleTask Repository Implementation
 */

import type Database from 'better-sqlite3';
import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import type {
  IScheduleTaskRepository,
  IScheduleTaskQueryOptions,
} from '@dailyuse/domain-server/schedule';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';

export class SqliteScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: ScheduleTask): Promise<void> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_tasks (
        uuid, account_uuid, name, description, source_module, source_entity_id, status,
        enabled, cron_expression, timezone, start_date, end_date, max_executions,
        next_run_at, last_run_at, execution_count, last_execution_status, last_execution_duration,
        consecutive_failures, max_retries, initial_delay_ms, max_delay_ms, backoff_multiplier,
        retryable_statuses, payload, tags, priority, timeout, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
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
      dto.uuid,
      dto.accountUuid,
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

  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const stmt = this.db.prepare(`SELECT * FROM schedule_tasks WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToTask(row);
  }

  async deleteByUuid(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_tasks WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async findByAccountUuid(accountUuid: string): Promise<ScheduleTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_tasks WHERE account_uuid = ? ORDER BY next_run_at ASC NULLS LAST`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findBySourceModule(module: SourceModule, accountUuid?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE source_module = ?`;
    const params: any[] = [module];

    if (accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(accountUuid);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findBySourceEntity(
    module: SourceModule,
    entityId: string,
    accountUuid?: string,
  ): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE source_module = ? AND source_entity_id = ?`;
    const params: any[] = [module, entityId];

    if (accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(accountUuid);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findByStatus(status: ScheduleTaskStatus, accountUuid?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE status = ?`;
    const params: any[] = [status];

    if (accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(accountUuid);
    }

    query += ` ORDER BY next_run_at ASC NULLS LAST`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findEnabled(accountUuid?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE enabled = 1 AND status = 'ACTIVE'`;
    const params: any[] = [];

    if (accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(accountUuid);
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

    if (options.accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(options.accountUuid);
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

    if (options.accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(options.accountUuid);
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

  async deleteBatch(uuids: string[]): Promise<void> {
    const transaction = this.db.transaction((ids: string[]) => {
      for (const uuid of ids) {
        this.deleteByUuid(uuid);
      }
    });
    transaction(uuids);
  }

  async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const transaction = this.db.transaction(() => callback());
    return transaction();
  }

  // Private helper method to convert database row to ScheduleTask
  private rowToTask(row: any): ScheduleTask {
    // Convert snake_case row properties to camelCase DTO
    return ScheduleTask.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
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
