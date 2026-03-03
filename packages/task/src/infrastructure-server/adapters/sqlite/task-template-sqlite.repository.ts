/**
 * SQLite TaskTemplate Repository Implementation
 * 浠诲姟妯℃澘鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { TaskTemplate } from '@/domain-server/aggregates/task-template';
import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '@/domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplateStatus } from '@/domain-shared/value-objects/task-template-status';
import { TaskTemplateId } from '@/domain-shared/value-objects/task-template-id';
import { TaskFolderId } from '@/domain-shared/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';

export class SqliteTaskTemplateRepository implements ITaskTemplateRepository {
  constructor(private db: Database.Database) {}

  private toDate(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const date = new Date(Number(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeStatus(status: string | null | undefined): TaskTemplateStatus {
    switch (status) {
      case TaskTemplateStatus.Active:
      case 'ACTIVE':
      case 'active':
        return TaskTemplateStatus.Active;
      case TaskTemplateStatus.Paused:
      case 'PAUSED':
      case 'paused':
        return TaskTemplateStatus.Paused;
      case TaskTemplateStatus.Archived:
      case 'ARCHIVED':
      case 'archived':
        return TaskTemplateStatus.Archived;
      case TaskTemplateStatus.Deleted:
      case 'DELETED':
      case 'deleted':
        return TaskTemplateStatus.Deleted;
      default:
        return TaskTemplateStatus.Active;
    }
  }

  private mapRowToTemplate(row: any): TaskTemplate {
    const createdAt = this.toDate(row.created_at ?? row.createdAt) ?? new Date();
    const updatedAt = this.toDate(row.updated_at ?? row.updatedAt) ?? createdAt;
    const deletedAt = this.toDate(row.deleted_at ?? row.deletedAt);
    const recurrencePattern = row.recurrence_pattern ?? row.recurrencePattern ?? null;
    const isRecurring =
      Number(row.is_recurring ?? row.isRecurring ?? 0) === 1 || Boolean(recurrencePattern);
    const tags = row.tags ? JSON.parse(row.tags) : [];

    return TaskTemplate.load({
      id: TaskTemplateId.of(row.id),
      identityId: IdentityId.of(row.identity_id ?? row.identityId),
      title: row.name,
      description: row.description ?? null,
      taskType: isRecurring ? 'RECURRING' : 'ONE_TIME',
      timeConfig: null,
      recurrenceRule: null,
      reminderConfig: null,
      importance: (row.importance ?? 'moderate') as ImportanceLevel,
      goalBinding: null,
      goalId: null,
      keyResultId: null,
      checklist: [],
      folderId:
        (row.folder_id ?? row.folderId) ? TaskFolderId.of(row.folder_id ?? row.folderId) : null,
      tags,
      color: row.color ?? null,
      status: this.normalizeStatus(row.status) as TaskTemplateStatus,
      lastGeneratedDate: null,
      generateAheadDays: null,
      parentTaskId:
        (row.parent_task_id ?? row.parentTaskId)
          ? TaskTemplateId.of(row.parent_task_id ?? row.parentTaskId)
          : null,
      dependencyStatus: row.dependency_status ?? row.dependencyStatus ?? 'NONE',
      isBlocked: Boolean(row.is_blocked ?? row.isBlocked ?? false),
      blockingReason: row.blocking_reason ?? row.blockingReason ?? null,
      startDate: null,
      dueDate: null,
      completedAt: null,
      estimatedMinutes: null,
      actualMinutes: null,
      note: null,
      version: Number(row.version ?? 1),
      createdAt,
      updatedAt,
      deletedAt,
    });
  }

  private buildFilterClause(filters?: TaskFilters): { whereSql: string; params: unknown[] } {
    if (!filters) {
      return { whereSql: '', params: [] };
    }

    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      clauses.push('status = ?');
      params.push(filters.status);
    }

    if (filters.folderId) {
      clauses.push('folder_id = ?');
      params.push(filters.folderId);
    }

    return {
      whereSql: clauses.length > 0 ? ` AND ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  async save(template: TaskTemplate): Promise<void> {
    const dto = template.toServerDTO();
    const recurrencePattern = dto.recurrenceRule
      ? JSON.stringify({
          type: dto.recurrenceRule.frequency,
          interval: dto.recurrenceRule.interval,
          daysOfWeek: dto.recurrenceRule.daysOfWeek,
        })
      : null;
    const isRecurring = dto.recurrenceRule ? 1 : 0;

    const stmt = this.db.prepare(`
      INSERT INTO task_templates (
        id, identity_id, folder_id, name, description, status,
        tags, goal_id, is_recurring, recurrence_pattern, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        identity_id = excluded.identity_id,
        folder_id = excluded.folder_id,
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        tags = excluded.tags,
        goal_id = excluded.goal_id,
        is_recurring = excluded.is_recurring,
        recurrence_pattern = excluded.recurrence_pattern,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    stmt.run(
      dto.id,
      dto.identityId,
      dto.folderId,
      dto.name,
      dto.description || null,
      dto.status,
      typeof dto.tags === 'string' ? dto.tags : JSON.stringify(dto.tags),
      dto.goalBinding?.goalId ?? null,
      isRecurring,
      recurrencePattern,
      typeof dto.createdAt === 'number' ? dto.createdAt : new Date(dto.createdAt).getTime(),
      typeof dto.updatedAt === 'number' ? dto.updatedAt : new Date(dto.updatedAt).getTime(),
      dto.deletedAt
        ? typeof dto.deletedAt === 'number'
          ? dto.deletedAt
          : new Date(dto.deletedAt).getTime()
        : null,
    );
  }

  async findById(id: string): Promise<TaskTemplate | null> {
    const stmt = this.db.prepare(`SELECT * FROM task_templates WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToTemplate(row);
  }

  async findByIdWithChildren(id: string): Promise<TaskTemplate | null> {
    // For SQLite, we handle children through separate queries
    return this.findById(id);
  }

  async findByIdentityId(identityId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findByStatus(identityId: string, status: TaskTemplateStatus): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId, status) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findActiveTemplates(identityId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId, TaskTemplateStatus.Active) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findByFolderId(folderId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE folder_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(folderId) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findByGoalId(goalId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE goal_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(goalId) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findByTags(identityId: string, tags: string[]): Promise<TaskTemplate[]> {
    // For simplicity, we search templates that contain any of the tags
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND tags IS NOT NULL AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows
      .map((row) => this.mapRowToTemplate(row))
      .filter((template) => {
        const templateTagsRaw = template.toServerDTO().tags;
        const templateTags =
          typeof templateTagsRaw === 'string' ? JSON.parse(templateTagsRaw) : templateTagsRaw;
        return tags.some((tag) => Array.isArray(templateTags) && templateTags.includes(tag));
      });
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE status = ? AND deleted_at IS NULL ORDER BY updated_at ASC`,
    );
    const rows = stmt.all(TaskTemplateStatus.Active) as any[];

    return rows
      .map((row) => this.mapRowToTemplate(row))
      .filter((template) => {
        const lastGeneratedDate = template.toServerDTO().lastGeneratedDate;
        if (!lastGeneratedDate) {
          return true;
        }
        return lastGeneratedDate < toDate;
      });
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM task_templates WHERE id = ?`);
    stmt.run(id);
  }

  async softDelete(id: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE task_templates SET status = ?, deleted_at = ?, updated_at = ? WHERE id = ?`,
    );
    const now = Date.now();
    stmt.run(TaskTemplateStatus.Deleted, now, now, id);
  }

  async restore(id: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE task_templates SET status = ?, deleted_at = NULL, updated_at = ? WHERE id = ?`,
    );
    stmt.run(TaskTemplateStatus.Active, Date.now(), id);
  }

  async findOneTimeTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    const { whereSql, params } = this.buildFilterClause(filters);
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND (is_recurring = 0 OR is_recurring IS NULL) AND deleted_at IS NULL${whereSql} ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId, ...params) as any[];
    const templates = rows.map((row) => this.mapRowToTemplate(row));

    if (typeof filters?.offset === 'number' || typeof filters?.limit === 'number') {
      const offset = filters.offset ?? 0;
      const limit = filters.limit ?? templates.length;
      return templates.slice(offset, offset + limit);
    }

    return templates;
  }

  async findRecurringTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    const { whereSql, params } = this.buildFilterClause(filters);
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND is_recurring = 1 AND deleted_at IS NULL${whereSql} ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId, ...params) as any[];
    const templates = rows.map((row) => this.mapRowToTemplate(row));

    if (typeof filters?.offset === 'number' || typeof filters?.limit === 'number') {
      const offset = filters.offset ?? 0;
      const limit = filters.limit ?? templates.length;
      return templates.slice(offset, offset + limit);
    }

    return templates;
  }

  async findOverdueTasks(identityId: string): Promise<TaskTemplate[]> {
    const templates = await this.findOneTimeTasks(identityId, {
      status: TaskTemplateStatus.Active,
    });
    return templates.filter((template) => template.isOverdue());
  }

  async findByKeyResultId(keyResultId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all() as any[];

    return rows
      .map((row) => this.mapRowToTemplate(row))
      .filter((template) => template.toServerDTO().goalBinding?.keyResultId === keyResultId);
  }

  async findSubtasks(parentTaskId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE parent_task_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    );
    const rows = stmt.all(parentTaskId) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findBlockedTasks(identityId: string): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND is_blocked = 1 AND deleted_at IS NULL ORDER BY created_at DESC`,
    );
    const rows = stmt.all(identityId) as any[];

    return rows.map((row) => this.mapRowToTemplate(row));
  }

  async findSortedByPriority(identityId: string, limit?: number): Promise<TaskTemplate[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM task_templates WHERE identity_id = ? AND deleted_at IS NULL ORDER BY importance ASC, created_at DESC`,
    );
    const rows = stmt.all(identityId) as any[];
    const templates = rows.map((row) => this.mapRowToTemplate(row));
    return typeof limit === 'number' ? templates.slice(0, limit) : templates;
  }

  async findUpcomingTasks(identityId: string, daysAhead: number): Promise<TaskTemplate[]> {
    const templates = await this.findOneTimeTasks(identityId, {
      status: TaskTemplateStatus.Active,
    });

    const now = Date.now();
    const end = now + daysAhead * 24 * 60 * 60 * 1000;

    return templates.filter((template) => {
      const timeConfig = template.toServerDTO().timeConfig;
      const timestamp = timeConfig?.startDate;
      if (!timestamp) {
        return false;
      }
      return timestamp >= now && timestamp <= end;
    });
  }

  async findTodayTasks(identityId: string): Promise<TaskTemplate[]> {
    return this.findUpcomingTasks(identityId, 1);
  }

  async countTasks(identityId: string, filters?: TaskFilters): Promise<number> {
    const { whereSql, params } = this.buildFilterClause(filters);
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM task_templates WHERE identity_id = ? AND deleted_at IS NULL${whereSql}`,
    );
    const result = stmt.get(identityId, ...params) as { count: number };
    return Number(result?.count ?? 0);
  }

  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO task_templates (
        id, identity_id, folder_id, name, description, status,
        tags, goal_id, is_recurring, recurrence_pattern, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        identity_id = excluded.identity_id,
        folder_id = excluded.folder_id,
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        tags = excluded.tags,
        goal_id = excluded.goal_id,
        is_recurring = excluded.is_recurring,
        recurrence_pattern = excluded.recurrence_pattern,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    const transaction = this.db.transaction((items: TaskTemplate[]) => {
      for (const template of items) {
        const dto = template.toServerDTO();
        const recurrencePattern = dto.recurrenceRule
          ? JSON.stringify({
              type: dto.recurrenceRule.frequency,
              interval: dto.recurrenceRule.interval,
              daysOfWeek: dto.recurrenceRule.daysOfWeek,
            })
          : null;

        stmt.run(
          dto.id,
          dto.identityId,
          dto.folderId,
          dto.name,
          dto.description || null,
          dto.status,
          typeof dto.tags === 'string' ? dto.tags : JSON.stringify(dto.tags),
          dto.goalBinding?.goalId ?? null,
          dto.recurrenceRule ? 1 : 0,
          recurrencePattern,
          typeof dto.createdAt === 'number' ? dto.createdAt : new Date(dto.createdAt).getTime(),
          typeof dto.updatedAt === 'number' ? dto.updatedAt : new Date(dto.updatedAt).getTime(),
          dto.deletedAt
            ? typeof dto.deletedAt === 'number'
              ? dto.deletedAt
              : new Date(dto.deletedAt).getTime()
            : null,
        );
      }
    });

    transaction(templates);
  }

  async deleteBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`DELETE FROM task_templates WHERE id IN (${placeholders})`);
    stmt.run(...ids);
  }
}
