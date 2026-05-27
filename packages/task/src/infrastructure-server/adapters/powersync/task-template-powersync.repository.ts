import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '../../../domain-server/repositories/i-task-template-repository';
import { TaskTemplate } from '../../../domain-server/aggregates/task-template';
import type { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
import {
  PowerSyncTaskTemplateMapper,
  type PowerSyncTaskTemplateRow,
} from './mappers/powersync-task-template.mapper';
import { PowerSyncTaskInstanceMapper } from './mappers/powersync-task-instance.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class PowerSyncTaskTemplateRepository
  extends AggregateRepositoryBase<TaskTemplate>
  implements ITaskTemplateRepository
{
  constructor(private readonly db: Queryable) {
    super(eventBusAdapter);
  }

  protected async persist(template: TaskTemplate): Promise<void> {
    const data = PowerSyncTaskTemplateMapper.toPersistence(template);
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM task_templates WHERE id = ? LIMIT 1',
      [data.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE task_templates
         SET identity_id = ?,
             name = ?,
             description = ?,
             status = ?,
             importance = ?,
             priority = ?,
             color = ?,
             tags = ?,
             folder_id = ?,
             parent_task_id = ?,
             time_config_type = ?,
             time_config_start_time = ?,
             time_config_end_time = ?,
             time_config_duration_minutes = ?,
             time_config_time_point = ?,
             time_config_time_range_start = ?,
             time_config_time_range_end = ?,
             recurrence_rule_type = ?,
             recurrence_rule_interval = ?,
             recurrence_rule_days_of_week = ?,
             recurrence_rule_day_of_month = ?,
             recurrence_rule_month_of_year = ?,
             recurrence_rule_end_date = ?,
             recurrence_rule_count = ?,
             reminder_config_enabled = ?,
             reminder_config_time_offset_minutes = ?,
             reminder_config_unit = ?,
             reminder_config_channel = ?,
             last_generated_date = ?,
             generate_ahead_days = ?,
             goal_binding = ?,
             checklist = ?,
             blocking_reason = ?,
             dependency_status = ?,
             is_blocked = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          data.identityId,
          data.name,
          data.description,
          data.status,
          data.importance,
          data.priority,
          data.color,
          data.tags,
          data.folderId,
          data.parentTaskId,
          data.timeConfigType,
          data.timeConfigStartTime,
          data.timeConfigEndTime,
          data.timeConfigDurationMinutes,
          data.timeConfigTimePoint,
          data.timeConfigTimeRangeStart,
          data.timeConfigTimeRangeEnd,
          data.recurrenceRuleType,
          data.recurrenceRuleInterval,
          data.recurrenceRuleDaysOfWeek,
          data.recurrenceRuleDayOfMonth,
          data.recurrenceRuleMonthOfYear,
          data.recurrenceRuleEndDate,
          data.recurrenceRuleCount,
          data.reminderConfigEnabled,
          data.reminderConfigTimeOffsetMinutes,
          data.reminderConfigUnit,
          data.reminderConfigChannel,
          data.lastGeneratedDate,
          data.generateAheadDays,
          data.goalBinding,
          data.checklist,
          data.blockingReason,
          data.dependencyStatus,
          data.isBlocked,
          data.version,
          data.updatedAt,
          data.deletedAt,
          data.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO task_templates (
          id, identity_id, name, description, status, importance, priority, color, tags, folder_id,
          parent_task_id, time_config_type, time_config_start_time, time_config_end_time,
          time_config_duration_minutes, time_config_time_point, time_config_time_range_start,
          time_config_time_range_end, recurrence_rule_type, recurrence_rule_interval,
          recurrence_rule_days_of_week, recurrence_rule_day_of_month, recurrence_rule_month_of_year,
          recurrence_rule_end_date, recurrence_rule_count, reminder_config_enabled,
          reminder_config_time_offset_minutes, reminder_config_unit, reminder_config_channel,
          last_generated_date, generate_ahead_days, goal_binding, checklist, blocking_reason,
          dependency_status, is_blocked, version, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.identityId,
          data.name,
          data.description,
          data.status,
          data.importance,
          data.priority,
          data.color,
          data.tags,
          data.folderId,
          data.parentTaskId,
          data.timeConfigType,
          data.timeConfigStartTime,
          data.timeConfigEndTime,
          data.timeConfigDurationMinutes,
          data.timeConfigTimePoint,
          data.timeConfigTimeRangeStart,
          data.timeConfigTimeRangeEnd,
          data.recurrenceRuleType,
          data.recurrenceRuleInterval,
          data.recurrenceRuleDaysOfWeek,
          data.recurrenceRuleDayOfMonth,
          data.recurrenceRuleMonthOfYear,
          data.recurrenceRuleEndDate,
          data.recurrenceRuleCount,
          data.reminderConfigEnabled,
          data.reminderConfigTimeOffsetMinutes,
          data.reminderConfigUnit,
          data.reminderConfigChannel,
          data.lastGeneratedDate,
          data.generateAheadDays,
          data.goalBinding,
          data.checklist,
          data.blockingReason,
          data.dependencyStatus,
          data.isBlocked,
          data.version,
          data.createdAt,
          data.updatedAt,
          data.deletedAt,
        ],
      );
    }
  }

  async findById(id: string): Promise<TaskTemplate | null> {
    const row = await this.db.getOptional<PowerSyncTaskTemplateRow>(
      'SELECT * FROM task_templates WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? PowerSyncTaskTemplateMapper.toDomain(row) : null;
  }

  async findByIdWithChildren(id: string): Promise<TaskTemplate | null> {
    const template = await this.findById(id);
    if (!template) return null;

    const instances = await this.db.getAll<any>(
      'SELECT * FROM task_instances WHERE template_id = ? ORDER BY instance_date DESC',
      [id],
    );
    instances
      .map((row) => PowerSyncTaskInstanceMapper.toDomain(row))
      .forEach((instance) => template.addInstance(instance));
    return template;
  }

  async findByIdentityId(identityId: string): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE identity_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [identityId],
    );
  }

  async findByStatus(identityId: string, status: TaskTemplateStatus): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE identity_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [identityId, status],
    );
  }

  async findActiveTemplates(identityId: string): Promise<TaskTemplate[]> {
    return this.findByStatus(identityId, 'Active' as TaskTemplateStatus);
  }

  async findByFolderId(folderId: string): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE folder_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [folderId],
    );
  }

  async findByGoalId(goalId: string): Promise<TaskTemplate[]> {
    const rows = await this.queryTemplates(
      'SELECT * FROM task_templates WHERE goal_binding IS NOT NULL AND deleted_at IS NULL ORDER BY created_at DESC',
      [],
    );
    return rows.filter((template) => template.toServerDTO().goalBinding?.goalId === goalId);
  }

  async findByTags(identityId: string, tags: string[]): Promise<TaskTemplate[]> {
    const rows = await this.findByIdentityId(identityId);
    return rows.filter((template) => tags.some((tag) => template.tags.includes(tag)));
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const rows = await this.queryTemplates(
      `SELECT * FROM task_templates
       WHERE recurrence_rule_type IS NOT NULL AND status = 'Active' AND deleted_at IS NULL
       ORDER BY updated_at ASC`,
      [],
    );
    return rows.filter((template) => {
      const lastGeneratedDate = template.toServerDTO().lastGeneratedDate;
      return lastGeneratedDate == null || lastGeneratedDate < toDate;
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM task_templates WHERE id = ?', [id]);
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      'UPDATE task_templates SET status = ?, deleted_at = ?, updated_at = ? WHERE id = ?',
      ['Deleted', now, now, id],
    );
  }

  async restore(id: string): Promise<void> {
    await this.db.execute(
      'UPDATE task_templates SET status = ?, deleted_at = NULL, updated_at = ? WHERE id = ?',
      ['Active', new Date().toISOString(), id],
    );
  }

  async findOneTimeTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    return this.queryByType(identityId, true, filters);
  }

  async findRecurringTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    return this.queryByType(identityId, false, filters);
  }

  async findOverdueTasks(identityId: string): Promise<TaskTemplate[]> {
    const rows = await this.findOneTimeTasks(identityId, { status: 'Active' });
    return rows.filter((template) => template.isOverdue());
  }

  async findByKeyResultId(keyResultId: string): Promise<TaskTemplate[]> {
    const rows = await this.queryTemplates(
      'SELECT * FROM task_templates WHERE goal_binding IS NOT NULL AND deleted_at IS NULL ORDER BY created_at DESC',
      [],
    );
    return rows.filter(
      (template) => template.toServerDTO().goalBinding?.keyResultId === keyResultId,
    );
  }

  async findSubtasks(parentTaskId: string): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE parent_task_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
      [parentTaskId],
    );
  }

  async findBlockedTasks(identityId: string): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE identity_id = ? AND is_blocked = 1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [identityId],
    );
  }

  async findSortedByPriority(identityId: string, limit?: number): Promise<TaskTemplate[]> {
    const sql = `SELECT * FROM task_templates WHERE identity_id = ? AND deleted_at IS NULL ORDER BY importance ASC, created_at DESC${limit ? ' LIMIT ?' : ''}`;
    return this.queryTemplates(sql, limit ? [identityId, limit] : [identityId]);
  }

  async findUpcomingTasks(identityId: string, daysAhead: number): Promise<TaskTemplate[]> {
    const rows = await this.findOneTimeTasks(identityId, { status: 'Active' });
    const now = Date.now();
    const end = now + daysAhead * 86400000;
    return rows.filter((template) => {
      const startDate = template.toServerDTO().timeConfig?.startDate;
      return startDate != null && startDate >= now && startDate <= end;
    });
  }

  async findTodayTasks(identityId: string): Promise<TaskTemplate[]> {
    return this.findUpcomingTasks(identityId, 1);
  }

  async countTasks(identityId: string, filters?: TaskFilters): Promise<number> {
    const where = this.buildFilters(
      ['identity_id = ?', 'deleted_at IS NULL'],
      [identityId],
      filters,
    );
    const result = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM task_templates WHERE ${where.clauses.join(' AND ')}`,
      where.params,
    );
    return Number(result.count ?? 0);
  }

  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    for (const template of templates) {
      await this.save(template);
    }
  }

  async deleteBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(`DELETE FROM task_templates WHERE id IN (${placeholders})`, ids);
  }

  private async queryByType(
    identityId: string,
    oneTime: boolean,
    filters?: TaskFilters,
  ): Promise<TaskTemplate[]> {
    const clauses = ['identity_id = ?', 'deleted_at IS NULL'];
    const params: unknown[] = [identityId];
    clauses.push(oneTime ? 'recurrence_rule_type IS NULL' : 'recurrence_rule_type IS NOT NULL');
    const where = this.buildFilters(clauses, params, filters);
    let sql = `SELECT * FROM task_templates WHERE ${where.clauses.join(' AND ')} ORDER BY created_at DESC`;
    if (filters?.limit) {
      sql += ' LIMIT ?';
      where.params.push(filters.limit);
    }
    if (filters?.offset) {
      sql += ' OFFSET ?';
      where.params.push(filters.offset);
    }
    return this.queryTemplates(sql, where.params);
  }

  private buildFilters(baseClauses: string[], baseParams: unknown[], filters?: TaskFilters) {
    const clauses = [...baseClauses];
    const params = [...baseParams];
    if (filters?.status) {
      clauses.push('status = ?');
      params.push(filters.status);
    }
    if (filters?.folderId) {
      clauses.push('folder_id = ?');
      params.push(filters.folderId);
    }
    if (filters?.parentTaskId) {
      clauses.push('parent_task_id = ?');
      params.push(filters.parentTaskId);
    }
    if (filters?.isBlocked !== undefined) {
      clauses.push('is_blocked = ?');
      params.push(filters.isBlocked ? 1 : 0);
    }
    return { clauses, params };
  }

  private async queryTemplates(sql: string, params: unknown[]): Promise<TaskTemplate[]> {
    const rows = await this.db.getAll<PowerSyncTaskTemplateRow>(sql, params);
    return rows.map((row) => PowerSyncTaskTemplateMapper.toDomain(row));
  }
}
