/**
 * SQLite TaskInstance Repository Implementation
 * 任务实例的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { TaskInstance } from '@dailyuse/domain-server/task';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';

export class SqliteTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private db: Database.Database) {}

  async save(instance: TaskInstance): Promise<void> {
    const dto = instance.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_instances (
        uuid, template_uuid, account_uuid, scheduled_date, status,
        completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.template_uuid,
      dto.account_uuid,
      dto.scheduled_date,
      dto.status,
      dto.completed_at || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO task_instances (
        uuid, template_uuid, account_uuid, scheduled_date, status,
        completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: TaskInstance[]) => {
      for (const instance of items) {
        const dto = instance.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.template_uuid,
          dto.account_uuid,
          dto.scheduled_date,
          dto.status,
          dto.completed_at || null,
          dto.created_at,
          dto.updated_at,
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
      account_uuid: row.account_uuid,
      scheduled_date: row.scheduled_date,
      status: row.status as TaskInstanceStatus,
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
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
        account_uuid: row.account_uuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE account_uuid = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.account_uuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByDateRange(accountUuid: string, startDate: number, endDate: number): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE account_uuid = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(accountUuid, startDate, endDate) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.account_uuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_instances WHERE account_uuid = ? AND status = ? ORDER BY scheduled_date DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.account_uuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT * FROM task_instances
      WHERE account_uuid = ? AND status != 'COMPLETED' AND scheduled_date < ?
      ORDER BY scheduled_date ASC
    `);
    const rows = stmt.all(accountUuid, now) as any[];

    return rows.map((row) =>
      TaskInstance.fromPersistenceDTO({
        uuid: row.uuid,
        template_uuid: row.template_uuid,
        account_uuid: row.account_uuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
        account_uuid: row.account_uuid,
        scheduled_date: row.scheduled_date,
        status: row.status as TaskInstanceStatus,
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
