import type {
  IScheduleTaskQueryOptions,
  IScheduleTaskRepository,
} from '../../../domain/repositories/i-schedule-task-repository';
import { ScheduleTask } from '../../../domain/aggregates/schedule-task';
import { ScheduleTaskStatus, type ScheduleEventMap, type SourceModule } from '@dailyuse/contracts/schedule';
import { createTypedEventPublisher, eventBus, flushDomainEvents } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import {
  PowerSyncScheduleTaskMapper,
  type PowerSyncScheduleTaskRow,
} from './mappers/powersync-schedule-task.mapper';
import type { PowerSyncScheduleExecutionRow } from './mappers/powersync-schedule-execution.mapper';
import type { IElectronDatabase, IElectronDatabaseTransaction } from '@dailyuse/contracts/electron';

const logger = createLogger('ScheduleTaskPowerSyncRepo');
const scheduleEventPublisher = createTypedEventPublisher<ScheduleEventMap>(eventBus);

export class PowerSyncScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(task: ScheduleTask): Promise<void> {
    const data = PowerSyncScheduleTaskMapper.toPersistence(task);
    const pendingDomainEvents = task.domainEvents.map((event) => event.eventType);

    logger.info('[Schedule][Repo] Saving task', {
      taskId: String(task.id),
      identityId: task.identityId,
      sourceModule: task.sourceModule,
      sourceEntityId: task.sourceEntityId,
      status: task.status,
      enabled: task.enabled,
      nextRunAt: task.nextRunAt?.toISOString() ?? null,
      executionCount: task.executionCount,
      pendingDomainEvents,
    });

    // 任务与其执行记录多条写入放进单事务，避免半持久化。
    await this.db.writeTransaction(async (tx: IElectronDatabaseTransaction) => {
      await this.saveWithin(tx, task, data);
    });

    if (pendingDomainEvents.length > 0) {
      // 事件在事务成功提交后派发；send 已具备 per-handler 错误隔离，派发失败不回滚业务。
      flushDomainEvents(scheduleEventPublisher, task);
      logger.info('[Schedule][Repo] Published domain events after PowerSync save', {
        taskId: String(task.id),
        publishedDomainEvents: pendingDomainEvents,
      });
    } else {
      logger.warn('[Schedule][Repo] PowerSync save completed without domain events to publish', {
        taskId: String(task.id),
      });
    }
  }

  private async saveWithin(
    tx: IElectronDatabaseTransaction,
    task: ScheduleTask,
    data: ReturnType<typeof PowerSyncScheduleTaskMapper.toPersistence>,
  ): Promise<void> {
    const existingTask = await tx.getOptional<{ id: string }>(
      'SELECT id FROM schedule_tasks WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existingTask) {
      await tx.execute(
        `UPDATE schedule_tasks
         SET name = ?,
             description = ?,
             source_module = ?,
             source_entity_id = ?,
             status = ?,
             enabled = ?,
             cron_expression = ?,
             timezone = ?,
             start_date = ?,
             end_date = ?,
             max_executions = ?,
             next_run_at = ?,
             last_run_at = ?,
             execution_count = ?,
             last_execution_status = ?,
             last_execution_duration = ?,
             consecutive_failures = ?,
             max_retries = ?,
             initial_delay_ms = ?,
             max_delay_ms = ?,
             backoff_multiplier = ?,
             retryable_statuses = ?,
             payload = ?,
             tags = ?,
             priority = ?,
             timeout = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          data.name,
          data.description,
          data.sourceModule,
          data.sourceEntityId,
          data.status,
          data.enabled,
          data.cronExpression,
          data.timezone,
          data.startDate,
          data.endDate,
          data.maxExecutions,
          data.nextRunAt,
          data.lastRunAt,
          data.executionCount,
          data.lastExecutionStatus,
          data.lastExecutionDuration,
          data.consecutiveFailures,
          data.maxRetries,
          data.initialDelayMs,
          data.maxDelayMs,
          data.backoffMultiplier,
          data.retryableStatuses,
          data.payload,
          data.tags,
          data.priority,
          data.timeout,
          data.version,
          data.updatedAt,
          data.deletedAt,
          data.id,
        ],
      );
    } else {
      await tx.execute(
        `INSERT INTO schedule_tasks (
          id, identity_id, name, description, source_module, source_entity_id, status, enabled,
          cron_expression, timezone, start_date, end_date, max_executions, next_run_at, last_run_at,
          execution_count, last_execution_status, last_execution_duration, consecutive_failures,
          max_retries, initial_delay_ms, max_delay_ms, backoff_multiplier, retryable_statuses,
          payload, tags, priority, timeout, version, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.identityId,
          data.name,
          data.description,
          data.sourceModule,
          data.sourceEntityId,
          data.status,
          data.enabled,
          data.cronExpression,
          data.timezone,
          data.startDate,
          data.endDate,
          data.maxExecutions,
          data.nextRunAt,
          data.lastRunAt,
          data.executionCount,
          data.lastExecutionStatus,
          data.lastExecutionDuration,
          data.consecutiveFailures,
          data.maxRetries,
          data.initialDelayMs,
          data.maxDelayMs,
          data.backoffMultiplier,
          data.retryableStatuses,
          data.payload,
          data.tags,
          data.priority,
          data.timeout,
          data.version,
          data.createdAt,
          data.updatedAt,
          data.deletedAt,
        ],
      );
    }

    const executions = task.executions ?? [];
    for (const execution of executions) {
      const existingExecution = await tx.getOptional<{ id: string }>(
        'SELECT id FROM schedule_executions WHERE id = ? LIMIT 1',
        [execution.id],
      );

      if (existingExecution) {
        await tx.execute(
          `UPDATE schedule_executions
           SET status = ?,
               duration = ?,
               result = ?,
               error = ?,
               retry_count = ?
           WHERE id = ?`,
          [
            execution.status,
            execution.duration ?? null,
            execution.result ? JSON.stringify(execution.result) : null,
            execution.error ?? null,
            execution.retryCount,
            execution.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO schedule_executions (
            id, task_id, identity_id, execution_time, status, duration, result, error, retry_count, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            execution.id,
            execution.taskId,
            execution.identityId ?? null,
            new Date(execution.executionTime).toISOString(),
            execution.status,
            execution.duration ?? null,
            execution.result ? JSON.stringify(execution.result) : null,
            execution.error ?? null,
            execution.retryCount,
            execution.createdAt.toISOString(),
          ],
        );
      }
    }
  }

  async findById(id: string): Promise<ScheduleTask | null> {
    const row = await this.db.getOptional<PowerSyncScheduleTaskRow>(
      'SELECT * FROM schedule_tasks WHERE id = ? LIMIT 1',
      [id],
    );
    if (!row) return null;
    const executions = await this.loadExecutions(row.id, 10);
    return PowerSyncScheduleTaskMapper.toDomain(row, executions);
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<ScheduleTask | null> {
    const row = await this.db.getOptional<PowerSyncScheduleTaskRow>(
      'SELECT * FROM schedule_tasks WHERE id = ? AND identity_id = ? LIMIT 1',
      [id, identityId],
    );
    if (!row) return null;
    const executions = await this.loadExecutions(row.id, 10);
    return PowerSyncScheduleTaskMapper.toDomain(row, executions);
  }

  async deleteById(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Schedule task not found for the current identity.');
    }
    await this.db.execute('DELETE FROM schedule_tasks WHERE id = ? AND identity_id = ?', [
      id,
      identityId,
    ]);
  }

  async findByIdentityId(identityId: string): Promise<ScheduleTask[]> {
    return this.queryRows(
      'SELECT * FROM schedule_tasks WHERE identity_id = ? ORDER BY next_run_at ASC',
      [identityId],
    );
  }

  async findBySourceModule(module: SourceModule, identityId: string): Promise<ScheduleTask[]> {
    return this.queryRows(
      `SELECT * FROM schedule_tasks WHERE source_module = ? AND identity_id = ? ORDER BY next_run_at ASC`,
      [module, identityId],
    );
  }

  async findBySourceEntity(
    module: SourceModule,
    entityId: string,
    identityId: string,
  ): Promise<ScheduleTask[]> {
    return this.queryRows(
      `SELECT * FROM schedule_tasks WHERE source_module = ? AND source_entity_id = ? AND identity_id = ? ORDER BY next_run_at ASC`,
      [module, entityId, identityId],
    );
  }

  async findByStatus(status: ScheduleTaskStatus, identityId: string): Promise<ScheduleTask[]> {
    return this.queryRows(
      `SELECT * FROM schedule_tasks WHERE status = ? AND identity_id = ? ORDER BY next_run_at ASC`,
      [status, identityId],
    );
  }

  async findEnabled(identityId?: string): Promise<ScheduleTask[]> {
    return this.queryRows(
      `SELECT * FROM schedule_tasks WHERE enabled = 1 AND status = ?${identityId ? ' AND identity_id = ?' : ''} ORDER BY next_run_at ASC`,
      identityId ? [ScheduleTaskStatus.Active, identityId] : [ScheduleTaskStatus.Active],
    );
  }

  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    return this.queryRows(
      `SELECT * FROM schedule_tasks
       WHERE enabled = 1 AND status = ? AND next_run_at <= ?
       ORDER BY next_run_at ASC${limit ? ' LIMIT ?' : ''}`,
      limit
        ? [ScheduleTaskStatus.Active, beforeTime.toISOString(), limit]
        : [ScheduleTaskStatus.Active, beforeTime.toISOString()],
    );
  }

  async query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]> {
    const clauses: string[] = ['identity_id = ?'];
    const params: unknown[] = [options.identityId];

    if (options.sourceModule) {
      clauses.push('source_module = ?');
      params.push(options.sourceModule);
    }
    if (options.sourceEntityId) {
      clauses.push('source_entity_id = ?');
      params.push(options.sourceEntityId);
    }
    if (options.status) {
      clauses.push('status = ?');
      params.push(options.status);
    }
    if (options.isEnabled !== undefined) {
      clauses.push('enabled = ?');
      params.push(options.isEnabled ? 1 : 0);
    }

    let sql = `SELECT * FROM schedule_tasks WHERE ${clauses.join(' AND ')}`;
    sql += ' ORDER BY next_run_at ASC';
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    return this.queryRows(sql, params);
  }

  async count(options: IScheduleTaskQueryOptions): Promise<number> {
    const clauses: string[] = ['identity_id = ?'];
    const params: unknown[] = [options.identityId];

    if (options.sourceModule) {
      clauses.push('source_module = ?');
      params.push(options.sourceModule);
    }
    if (options.sourceEntityId) {
      clauses.push('source_entity_id = ?');
      params.push(options.sourceEntityId);
    }
    if (options.status) {
      clauses.push('status = ?');
      params.push(options.status);
    }
    if (options.isEnabled !== undefined) {
      clauses.push('enabled = ?');
      params.push(options.isEnabled ? 1 : 0);
    }

    const sql = `SELECT COUNT(*) as count FROM schedule_tasks WHERE ${clauses.join(' AND ')}`;
    const row = await this.db.getOptional<{ count: number }>(sql, params);
    return Number(row?.count ?? 0);
  }

  async saveBatch(tasks: ScheduleTask[]): Promise<void> {
    for (const task of tasks) {
      await this.save(task);
    }
  }

  async deleteBatch(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `DELETE FROM schedule_tasks WHERE identity_id = ? AND id IN (${placeholders})`,
      [identityId, ...ids],
    );
  }

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return fn(this);
  }

  private async queryRows(sql: string, params: unknown[]): Promise<ScheduleTask[]> {
    const rows = await this.db.getAll<PowerSyncScheduleTaskRow>(sql, params);
    return Promise.all(
      rows.map(async (row) => {
        const executions = await this.loadExecutions(row.id, 10);
        return PowerSyncScheduleTaskMapper.toDomain(row, executions);
      }),
    );
  }

  private async loadExecutions(
    taskId: string,
    limit: number,
  ): Promise<PowerSyncScheduleExecutionRow[]> {
    return this.db.getAll<PowerSyncScheduleExecutionRow>(
      'SELECT * FROM schedule_executions WHERE task_id = ? ORDER BY created_at DESC LIMIT ?',
      [taskId, limit],
    );
  }
}
