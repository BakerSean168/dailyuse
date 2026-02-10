/**
 * SQLite TaskInstance Repository Implementation
 * 浠诲姟瀹炰緥鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { TaskInstance } from '@/domain-server';
import type { ITaskInstanceRepository } from '@/domain-server';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';

export class SqliteTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private db: Database.Database) {}

  async save(instance: TaskInstance): Promise<void> {
    const dto = instance.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_instances (
        uuid, template_uuid, accountUuid, scheduled_date, status,
        completedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.template_uuid,
      dto.accountUuid,
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
        uuid, template_uuid, accountUuid, scheduled_date, status,
        completedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `);

    const transaction = this.db.transaction((items: TaskInstance[]) => {
      for (const instance of items) {
        const dto = instance.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.template_uuid,
          dto.accountUuid,
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

  async findByUuid(uuid: string): Promise<TaskInstance | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_instances WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return TaskInstance.fromPersistenceDTO({
      uuid: row.uuid,
      template_uuid: row.template_uuid,
      account_uuid: row.accountUuid,
      scheduled_date: row.scheduled_date,
      status: row.status as TaskInstanceStatus,
      completed_at: row.completedAt ? new Date(row.completedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByTemplate(templateUuid: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE template_uuid = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(templateUuid) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.accountUuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE accountUuid = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.accountUuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByDateRange(accountUuid: string, startDate: number, endDate: number): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE accountUuid = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(accountUuid, startDate, endDate) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.accountUuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE accountUuid = ? AND status = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.accountUuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE accountUuid = ? AND status != 'COMPLETED' AND scheduled_date < ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(accountUuid, now) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.accountUuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_instances WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteMany(uuids: string[]): Promise<void> {
    const placeholders = uuids.map(() => '?').join(',');
    const stmt = this.db.prepare(`DELETE FROM task_instances WHERE uuid IN (${placeholders})`);
    stmt.run(...uuids);
  }

  async deleteByTemplate(templateUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_instances WHERE template_uuid = ?`);
    stmt.run(templateUuid);
  }

  async countFutureInstances(templateUuid: string, fromDate?: number): Promise<number> {
    const date = fromDate || Date.now();
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM task_instances WHERE template_uuid = ? AND scheduled_date >= ? AND status != 'COMPLETED'`
    );
    const result = stmt.get(templateUuid, date) as any;
    return result.count;
  }

  async findByTemplateUuidAndDateRange(
    templateUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE template_uuid = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(templateUuid, startDate, endDate) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.accountUuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completedAt ? new Date(row.completedAt) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async deleteFuturePendingInstances(templateUuid: string, fromDate: number): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM task_instances
      WHERE template_uuid = ? AND scheduled_date >= ? AND status IN ('PENDING', 'SCHEDULED')
    `);
    stmt.run(templateUuid, fromDate);
  }
}

