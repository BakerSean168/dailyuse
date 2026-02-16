/**
 * SQLite TaskInstance Repository Implementation
 * 浠诲姟瀹炰緥鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';
import type { ITaskInstanceRepository } from '../../../domain-server/repositories/ITaskInstanceRepository';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';

export class SqliteTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private db: Database.Database) {}

  async save(instance: TaskInstance): Promise<void> {
    const dto = instance.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_instances (
        id, template_id, identityId, scheduled_date, status,
        completedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.id,
      dto.template_id,
      dto.identityId,
      dto.scheduled_date,
      dto.status,
      dto.completedAt || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO task_instances (
        id, template_id, identityId, scheduled_date, status,
        completedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: TaskInstance[]) => {
      for (const instance of items) {
        const dto = instance.toPersistenceDTO();
        insertStmt.run(
          dto.id,
          dto.template_id,
          dto.identityId,
          dto.scheduled_date,
          dto.status,
          dto.completedAt || null,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(instances);
  }

  async findById(id: string): Promise<TaskInstance | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_instances WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return TaskInstance.fromPersistenceDTO({
      id: row.id,
      template_id: row.template_id,
      identity_id: row.identityId,
      scheduled_date: row.scheduled_date,
      status: row.status as TaskInstanceStatus,
      completed_at: row.completedAt ? new Date(row.completedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByTemplate(templateId: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE template_id = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(templateId) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        id: row.id,
        template_id: row.template_id,
        identity_id: row.identityId,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccount(identityId: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE identityId = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        id: row.id,
        template_id: row.template_id,
        identity_id: row.identityId,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByDateRange(identityId: string, startDate: number, endDate: number): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE identityId = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(identityId, startDate, endDate) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        id: row.id,
        template_id: row.template_id,
        identity_id: row.identityId,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByStatus(identityId: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE identityId = ? AND status = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        id: row.id,
        template_id: row.template_id,
        identity_id: row.identityId,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findOverdueInstances(identityId: string): Promise<TaskInstance[]> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE identityId = ? AND status != 'COMPLETED' AND scheduled_date < ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(identityId, now) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        id: row.id,
        template_id: row.template_id,
        identity_id: row.identityId,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
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

  async deleteByTemplate(templateId: string): Promise<void> {
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

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        id: row.id,
        template_id: row.template_id,
        identity_id: row.identityId,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async deleteFuturePendingInstances(templateId: string, fromDate: number): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM task_instances
      WHERE template_id = ? AND scheduled_date >= ? AND status IN ('PENDING', 'SCHEDULED')
    `);
    stmt.run(templateId, fromDate);
  }
}

