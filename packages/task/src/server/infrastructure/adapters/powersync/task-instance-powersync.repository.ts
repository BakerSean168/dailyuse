import type {
  ITaskInstanceRepository,
  TaskTemplateInstanceStats,
} from '../../../domain/repositories/i-task-instance-repository';
import type { IElectronDatabaseTransaction } from '@dailyuse/contracts/electron';
import { TaskInstance } from '../../../domain/aggregates/task-instance';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  type IEventBus,
} from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
import {
  PowerSyncTaskInstanceMapper,
  type PowerSyncTaskInstanceRow,
} from './mappers/powersync-task-instance.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class PowerSyncTaskInstanceRepository
  extends AggregateRepositoryBase<TaskInstance>
  implements ITaskInstanceRepository
{
  constructor(
    private readonly db: IElectronDatabaseTransaction,
    eventBus: IEventBus = eventBusAdapter,
  ) {
    super(eventBus);
  }

  protected async persist(instance: TaskInstance): Promise<void> {
    const data = PowerSyncTaskInstanceMapper.toPersistence(instance);
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM task_instances WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE task_instances
         SET template_id = ?,
             identity_id = ?,
             instance_date = ?,
             status = ?,
             importance = ?,
             priority = ?,
             time_config = ?,
             actual_start_time = ?,
             actual_end_time = ?,
             comment = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          data.templateId,
          data.identityId,
          data.instanceDate,
          data.status,
          data.importance,
          data.priority,
          data.timeConfig,
          data.actualStartTime,
          data.actualEndTime,
          data.comment,
          data.version,
          data.updatedAt,
          data.deletedAt,
          data.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO task_instances (
          id, template_id, identity_id, instance_date, status, importance, priority, time_config,
          actual_start_time, actual_end_time, comment, version, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.templateId,
          data.identityId,
          data.instanceDate,
          data.status,
          data.importance,
          data.priority,
          data.timeConfig,
          data.actualStartTime,
          data.actualEndTime,
          data.comment,
          data.version,
          data.createdAt,
          data.updatedAt,
          data.deletedAt,
        ],
      );
    }
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    for (const instance of instances) {
      await this.save(instance);
    }
  }

  async findById(id: string): Promise<TaskInstance | null> {
    const row = await this.db.getOptional<PowerSyncTaskInstanceRow>(
      'SELECT * FROM task_instances WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncTaskInstanceMapper.toDomain(row) : null;
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<TaskInstance | null> {
    const row = await this.db.getOptional<PowerSyncTaskInstanceRow>(
      'SELECT * FROM task_instances WHERE id = ? AND identity_id = ? LIMIT 1',
      [id, identityId],
    );
    return row ? PowerSyncTaskInstanceMapper.toDomain(row) : null;
  }

  async findByTemplateId(templateId: string): Promise<TaskInstance[]> {
    return this.query(
      'SELECT * FROM task_instances WHERE template_id = ? AND deleted_at IS NULL ORDER BY instance_date DESC',
      [templateId],
    );
  }

  async findByIdentityId(identityId: string): Promise<TaskInstance[]> {
    return this.query(
      'SELECT * FROM task_instances WHERE identity_id = ? AND deleted_at IS NULL ORDER BY instance_date DESC',
      [identityId],
    );
  }

  async findByDateRange(
    identityId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    return this.query(
      `SELECT * FROM task_instances WHERE identity_id = ? AND instance_date >= ? AND instance_date <= ? AND deleted_at IS NULL ORDER BY instance_date ASC`,
      [identityId, new Date(startDate).toISOString(), new Date(endDate).toISOString()],
    );
  }

  async findByStatus(identityId: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    return this.query(
      'SELECT * FROM task_instances WHERE identity_id = ? AND status = ? AND deleted_at IS NULL ORDER BY instance_date DESC',
      [identityId, status],
    );
  }

  async findOverdueInstances(identityId: string): Promise<TaskInstance[]> {
    return this.query(
      `SELECT * FROM task_instances WHERE identity_id = ? AND status IN ('Pending', 'InProgress') AND instance_date < ? AND deleted_at IS NULL ORDER BY instance_date ASC`,
      [identityId, new Date().toISOString()],
    );
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Task instance not found for the current identity.');
    }
    await this.db.execute('DELETE FROM task_instances WHERE id = ? AND identity_id = ?', [
      id,
      identityId,
    ]);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(`DELETE FROM task_instances WHERE id IN (${placeholders})`, ids);
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.db.execute('DELETE FROM task_instances WHERE template_id = ?', [templateId]);
  }

  async countFutureInstances(templateId: string, fromDate: number = Date.now()): Promise<number> {
    const row = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM task_instances WHERE template_id = ? AND instance_date >= ?',
      [templateId, new Date(fromDate).toISOString()],
    );
    return Number(row.count ?? 0);
  }

  async findByTemplateIdAndDateRange(
    templateId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    return this.query(
      `SELECT * FROM task_instances WHERE template_id = ? AND instance_date >= ? AND instance_date <= ? AND deleted_at IS NULL ORDER BY instance_date ASC`,
      [templateId, new Date(startDate).toISOString(), new Date(endDate).toISOString()],
    );
  }

  async getTemplateStats(templateIds: string[]): Promise<Record<string, TaskTemplateInstanceStats>> {
    if (templateIds.length === 0) {
      return {};
    }

    const placeholders = templateIds.map(() => '?').join(', ');
    const rows = await this.db.getAll<{
      templateId: string;
      status: string;
      count: number;
    }>(
      `SELECT template_id as templateId, status, COUNT(*) as count
         FROM task_instances
        WHERE template_id IN (${placeholders})
          AND deleted_at IS NULL
        GROUP BY template_id, status`,
      templateIds,
    );

    const stats: Record<string, TaskTemplateInstanceStats> = {};

    for (const templateId of templateIds) {
      stats[templateId] = {
        templateId,
        instanceCount: 0,
        completedInstanceCount: 0,
        pendingInstanceCount: 0,
        completionRate: 0,
      };
    }

    for (const row of rows) {
      const stat = stats[row.templateId];
      if (!stat) {
        continue;
      }

      const count = Number(row.count ?? 0);
      stat.instanceCount += count;

      if (row.status === 'Completed') {
        stat.completedInstanceCount += count;
      }

      if (row.status === 'Pending') {
        stat.pendingInstanceCount += count;
      }
    }

    for (const stat of Object.values(stats)) {
      stat.completionRate =
        stat.instanceCount > 0
          ? Math.round((stat.completedInstanceCount / stat.instanceCount) * 100)
          : 0;
    }

    return stats;
  }

  async deleteIncompleteInstancesFrom(templateId: string, fromDate: number): Promise<number> {
    const before = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count
         FROM task_instances
        WHERE template_id = ?
          AND instance_date >= ?
          AND status IN ('Pending', 'InProgress')`,
      [templateId, new Date(fromDate).toISOString()],
    );

    await this.db.execute(
      `DELETE FROM task_instances
        WHERE template_id = ?
          AND instance_date >= ?
          AND status IN ('Pending', 'InProgress')`,
      [templateId, new Date(fromDate).toISOString()],
    );

    return Number(before?.count ?? 0);
  }

  private async query(sql: string, params: unknown[]): Promise<TaskInstance[]> {
    const rows = await this.db.getAll<PowerSyncTaskInstanceRow>(sql, params);
    return rows.map((row) => PowerSyncTaskInstanceMapper.toDomain(row));
  }
}


