/**
 * SQLite TaskTemplate Repository Implementation
 * 任务模板的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { TaskTemplate } from '@dailyuse/domain-server/task';
import type { ITaskTemplateRepository, TaskFilters } from '@dailyuse/domain-server/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';

export class SqliteTaskTemplateRepository implements ITaskTemplateRepository {
  constructor(private db: Database.Database) {}

  async save(template: TaskTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_templates (
        uuid, account_uuid, name, description, status, folder_uuid,
        goal_uuid, priority, tags, due_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        folder_uuid = excluded.folder_uuid,
        goal_uuid = excluded.goal_uuid,
        priority = excluded.priority,
        tags = excluded.tags,
        due_date = excluded.due_date,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.name,
      dto.description || null,
      dto.status,
      dto.folder_uuid || null,
      dto.goal_uuid || null,
      dto.priority || null,
      dto.tags ? JSON.stringify(dto.tags) : null,
      dto.due_date || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<TaskTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_templates WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return TaskTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      description: row.description,
      status: row.status as TaskTemplateStatus,
      folder_uuid: row.folder_uuid,
      goal_uuid: row.goal_uuid,
      priority: row.priority,
      tags: row.tags ? JSON.parse(row.tags) : [],
      due_date: row.due_date,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null> {
    // For SQLite, we handle children through separate queries
    return this.findByUuid(uuid);
  }

  async findByAccount(accountUuid: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE account_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByStatus(accountUuid: string, status: TaskTemplateStatus): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE account_uuid = ? AND status = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid, status) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE account_uuid = ? AND status IN ('ACTIVE', 'IN_PROGRESS') ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByFolder(folderUuid: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE folder_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(folderUuid) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE goal_uuid = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(goalUuid) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByTags(accountUuid: string, tags: string[]): Promise<TaskTemplate[]> {
    // For simplicity, we search templates that contain any of the tags
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE account_uuid = ? AND tags IS NOT NULL ORDER BY created_at DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows
      .map((row) => this.rowToTemplate(row))
      .filter((template) => {
        const templateTags = template.toPersistenceDTO().tags || [];
        return tags.some((tag) => templateTags.includes(tag));
      });
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE status = 'ACTIVE' AND (last_instance_generated_at IS NULL OR last_instance_generated_at < ?) ORDER BY updated_at ASC`
    );
    const rows = stmt.all(toDate) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_templates WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE task_templates SET status = 'DELETED', updated_at = ? WHERE uuid = ?`
    );
    stmt.run(Date.now(), uuid);
  }

  async restore(uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE task_templates SET status = 'ACTIVE', updated_at = ? WHERE uuid = ?`
    );
    stmt.run(Date.now(), uuid);
  }

  private rowToTemplate(row: any): TaskTemplate {
    return TaskTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      name: row.name,
      description: row.description,
      status: row.status as TaskTemplateStatus,
      folder_uuid: row.folder_uuid,
      goal_uuid: row.goal_uuid,
      priority: row.priority,
      tags: row.tags ? JSON.parse(row.tags) : [],
      due_date: row.due_date,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }
}
