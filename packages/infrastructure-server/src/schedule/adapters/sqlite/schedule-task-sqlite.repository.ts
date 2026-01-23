/**
 * SQLite ScheduleTask Repository Implementation
 * 日程任务的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import type { IScheduleTaskRepository, IScheduleTaskQueryOptions } from '@dailyuse/domain-server/schedule';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';

export class SqliteScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private db: Database.Database) {}

  async save(task: ScheduleTask): Promise<void> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO schedule_tasks (
        uuid, account_uuid, source_module, source_entity_id, status,
        is_enabled, scheduled_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        is_enabled = excluded.is_enabled,
        scheduled_time = excluded.scheduled_time,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.source_module,
      dto.source_entity_id,
      dto.status,
      dto.is_enabled ? 1 : 0,
      dto.scheduled_time,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const stmt = this.db.prepare(`SELECT * FROM schedule_tasks WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return ScheduleTask.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      source_module: row.source_module as SourceModule,
      source_entity_id: row.source_entity_id,
      status: row.status as ScheduleTaskStatus,
      is_enabled: row.is_enabled === 1,
      scheduled_time: row.scheduled_time,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async deleteByUuid(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM schedule_tasks WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async findByAccountUuid(accountUuid: string): Promise<ScheduleTask[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM schedule_tasks WHERE account_uuid = ? ORDER BY scheduled_time DESC`
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

    query += ` ORDER BY scheduled_time DESC`;

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

    query += ` ORDER BY scheduled_time DESC`;

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

    query += ` ORDER BY scheduled_time DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findEnabled(accountUuid?: string): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE is_enabled = 1`;
    const params: any[] = [];

    if (accountUuid) {
      query += ` AND account_uuid = ?`;
      params.push(accountUuid);
    }

    query += ` ORDER BY scheduled_time DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.rowToTask(row));
  }

  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    let query = `SELECT * FROM schedule_tasks WHERE is_enabled = 1 AND status IN ('ACTIVE', 'PENDING') AND scheduled_time <= ? ORDER BY scheduled_time ASC`;
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
      query += ` AND is_enabled = ?`;
      params.push(options.isEnabled ? 1 : 0);
    }

    query += ` ORDER BY scheduled_time DESC`;

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
      query += ` AND is_enabled = ?`;
      params.push(options.isEnabled ? 1 : 0);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;

    return result.count;
  }

  private rowToTask(row: any): ScheduleTask {
    return ScheduleTask.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      source_module: row.source_module as SourceModule,
      source_entity_id: row.source_entity_id,
      status: row.status as ScheduleTaskStatus,
      is_enabled: row.is_enabled === 1,
      scheduled_time: row.scheduled_time,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }
}
