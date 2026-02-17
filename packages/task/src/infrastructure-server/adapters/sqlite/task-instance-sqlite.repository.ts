/**
 * SQLite TaskInstance Repository Implementation
 * 浠诲姟瀹炰緥鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';
import type { ITaskInstanceRepository } from '../../../domain-server/repositories/ITaskInstanceRepository';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

export class SqliteTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private db: Database.Database) {}

  private normalizeStatus(status: string | null | undefined): TaskInstanceStatus {
    if (!status) return TaskInstanceStatus.Pending;
    switch (status) {
      case 'PENDING':
      case 'Pending':
        return TaskInstanceStatus.Pending;
      case 'IN_PROGRESS':
      case 'InProgress':
        return TaskInstanceStatus.InProgress;
      case 'COMPLETED':
      case 'Completed':
        return TaskInstanceStatus.Completed;
      case 'SKIPPED':
      case 'Skipped':
        return TaskInstanceStatus.Skipped;
      case 'EXPIRED':
      case 'Expired':
        return TaskInstanceStatus.Expired;
      default:
        return TaskInstanceStatus.Pending;
    }
  }

  private mapRowToInstance(row: any): TaskInstance {
    const instanceDate = Number(row.instance_date ?? row.scheduled_date ?? row.instanceDate ?? Date.now());
    const createdAt = Number(row.created_at ?? row.createdAt ?? Date.now());
    const updatedAt = Number(row.updated_at ?? row.updatedAt ?? createdAt);
    const actualEndTime = row.actual_end_time ?? row.actualEndTime ?? row.completed_at ?? row.completedAt ?? null;

    return TaskInstance.fromPersistenceDTO({
      id: row.id,
      templateId: row.template_id ?? row.templateId,
      identityId: row.identity_id ?? row.identityId,
      importance: row.importance ?? ImportanceLevel.Moderate,
      priority: row.priority ?? undefined,
      instanceDate: new Date(instanceDate),
      timeConfig:
        row.time_config ??
        row.timeConfig ??
        JSON.stringify({
          timeType: 'AllDay',
          startDate: instanceDate,
          timePoint: null,
          timeRange: null,
        }),
      status: this.normalizeStatus(row.status),
      actualStartTime:
        row.actual_start_time ?? row.actualStartTime
          ? new Date(Number(row.actual_start_time ?? row.actualStartTime))
          : null,
      actualEndTime: actualEndTime ? new Date(Number(actualEndTime)) : null,
      comment: row.comment ?? row.notes ?? null,
      version: Number(row.version ?? 1),
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      deletedAt:
        row.deleted_at ?? row.deletedAt ? new Date(Number(row.deleted_at ?? row.deletedAt)) : null,
    });
  }

  async save(instance: TaskInstance): Promise<void> {
    const dto = instance.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_instances (
        id, identity_id, template_id, scheduled_date, status,
        completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.templateId,
      dto.instanceDate.getTime(),
      dto.status,
      dto.actualEndTime?.getTime() ?? null,
      dto.createdAt.getTime(),
      dto.updatedAt.getTime(),
    );
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO task_instances (
        id, identity_id, template_id, scheduled_date, status,
        completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: TaskInstance[]) => {
      for (const instance of items) {
        const dto = instance.toPersistenceDTO();
        insertStmt.run(
          dto.id,
          dto.identityId,
          dto.templateId,
          dto.instanceDate.getTime(),
          dto.status,
          dto.actualEndTime?.getTime() ?? null,
          dto.createdAt.getTime(),
          dto.updatedAt.getTime(),
        );
      }
    });

    transaction(instances);
  }

  async findById(id: string): Promise<TaskInstance | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_instances WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToInstance(row);
  }

  async findByTemplateId(templateId: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE template_id = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(templateId) as any[];

    return rows.map((row) => this.mapRowToInstance(row));
  }

  async findByIdentityId(identityId: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE identity_id = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.mapRowToInstance(row));
  }

  async findByDateRange(identityId: string, startDate: number, endDate: number): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE identity_id = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(identityId, startDate, endDate) as any[];

    return rows.map((row) => this.mapRowToInstance(row));
  }

  async findByStatus(identityId: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE identity_id = ? AND status = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) => this.mapRowToInstance(row));
  }

  async findOverdueInstances(identityId: string): Promise<TaskInstance[]> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE identity_id = ? AND status != 'Completed' AND status != 'COMPLETED' AND scheduled_date < ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(identityId, now) as any[];

    return rows.map((row) => this.mapRowToInstance(row));
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_instances WHERE id = ?`);
    stmt.run(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`DELETE FROM task_instances WHERE id IN (${placeholders})`);
    stmt.run(...ids);
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_instances WHERE template_id = ?`);
    stmt.run(templateId);
  }

  async countFutureInstances(templateId: string, fromDate?: number): Promise<number> {
    const date = fromDate || Date.now();
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM task_instances WHERE template_id = ? AND scheduled_date >= ? AND status != 'COMPLETED'`
    );
    const result = stmt.get(templateId, date) as any;
    return result.count;
  }

  async findByTemplateIdAndDateRange(
    templateId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE template_id = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(templateId, startDate, endDate) as any[];

    return rows.map((row) => this.mapRowToInstance(row));
  }

  async deleteFuturePendingInstances(templateId: string, fromDate: number): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM task_instances
      WHERE template_id = ? AND scheduled_date >= ? AND status IN ('PENDING', 'SCHEDULED')
    `);
    stmt.run(templateId, fromDate);
  }
}

