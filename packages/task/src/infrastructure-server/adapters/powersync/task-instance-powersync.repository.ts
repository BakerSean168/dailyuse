import type { ITaskInstanceRepository } from '../../../domain-server/repositories/ITaskInstanceRepository';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import {
  PowerSyncTaskInstanceMapper,
  type PowerSyncTaskInstanceRow,
} from './mappers/powersync-task-instance.mapper';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class PowerSyncTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private readonly db: Queryable) {}

  async save(instance: TaskInstance): Promise<void> {
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

    for (const evt of instance.pullDomainEvents()) {
      eventBus.send(evt.eventType as any, evt.payload as any);
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

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM task_instances WHERE id = ?', [id]);
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

  async deleteFuturePendingInstances(templateId: string, fromDate: number): Promise<void> {
    await this.db.execute(
      `DELETE FROM task_instances WHERE template_id = ? AND instance_date >= ? AND status = 'Pending'`,
      [templateId, new Date(fromDate).toISOString()],
    );
  }

  private async query(sql: string, params: unknown[]): Promise<TaskInstance[]> {
    const rows = await this.db.getAll<PowerSyncTaskInstanceRow>(sql, params);
    return rows.map((row) => PowerSyncTaskInstanceMapper.toDomain(row));
  }
}
