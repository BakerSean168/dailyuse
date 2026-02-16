/**
 * SQLite TaskTemplate Repository Implementation
 * 浠诲姟妯℃澘鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { TaskTemplate } from '../../../domain-server/aggregates/task-template';
import type { ITaskTemplateRepository, TaskFilters } from '../../../domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';

export class SqliteTaskTemplateRepository implements ITaskTemplateRepository {
  constructor(private db: Database.Database) {}

  async save(template: TaskTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO task_templates (
        id, identity_id, name, description, status, folder_id,
        goal_id, tags, due_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        folder_id = excluded.folder_id,
        goal_id = excluded.goal_id,
        tags = excluded.tags,
        due_date = excluded.due_date,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.title,
      dto.description || null,
      dto.status,
      dto.folderId || null,
      dto.goalId || null,
      dto.tags ? JSON.stringify(dto.tags) : null,
      dto.dueDate || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(id: string): Promise<TaskTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_templates WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToTemplate(row);
  }

  async findByIdWithChildren(id: string): Promise<TaskTemplate | null> {
    // For SQLite, we handle children through separate queries
    return this.findById(id);
  }

  async findByAccount(identityId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByStatus(identityId: string, status: TaskTemplateStatus): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND status = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findActiveTemplates(identityId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND status IN ('ACTIVE', 'IN_PROGRESS') ORDER BY created_at DESC`
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByFolder(folderId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE folder_id = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(folderId) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByGoal(goalId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE goal_id = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(goalId) as any[];

    return rows.map((row) => this.rowToTemplate(row));
  }

  async findByTags(identityId: string, tags: string[]): Promise<TaskTemplate[]> {
    // For simplicity, we search templates that contain any of the tags
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND tags IS NOT NULL ORDER BY created_at DESC`
    );
    const rows = stmt.all(identityId) as any[];

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

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_templates WHERE id = ?`);
    stmt.run(id);
  }

  async softDelete(id: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE task_templates SET status = 'DELETED', updated_at = ? WHERE id = ?`
    );
    stmt.run(Date.now(), id);
  }

  async restore(id: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE task_templates SET status = 'ACTIVE', updated_at = ? WHERE id = ?`
    );
    stmt.run(Date.now(), id);
  }

  private rowToTemplate(row: any): TaskTemplate {
    // 从蛇形的行对象属性转换为驼峰的 DTO 对象
    return TaskTemplate.fromPersistenceDTO({
      id: row.id,
      identityId: row.identity_id,
      name: row.name,
      description: row.description,
      taskType: 'ONE_TIME',
      status: row.status as TaskTemplateStatus,
      importance: row.importance,
      folderId: row.folder_id,
      goalId: row.goal_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

