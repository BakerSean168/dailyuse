import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '../../../domain/repositories/i-task-template-repository';
import { TaskTemplate } from '../../../domain/aggregates/task-template';
import type { IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import type { TaskTemplateStatus } from '@memoflow/contracts/task';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  type IEventBus,
} from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import {
  PowerSyncTaskTemplateMapper,
  type PowerSyncTaskTemplateRow,
} from './mappers/powersync-task-template.mapper';
import { PowerSyncTaskInstanceMapper, type PowerSyncTaskInstanceRow } from './mappers/powersync-task-instance.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class PowerSyncTaskTemplateRepository
  extends AggregateRepositoryBase<TaskTemplate>
  implements ITaskTemplateRepository
{
  constructor(
    private readonly db: IElectronDatabaseTransaction,
    eventBus: IEventBus = eventBusAdapter,
  ) {
    super(eventBus);
  }

  protected async persist(template: TaskTemplate): Promise<void> {
    const data = PowerSyncTaskTemplateMapper.toPersistence(template);
    const existing = await this.db.getOptional<{ id: string }>(
      'SELECT id FROM task_templates WHERE id = ? LIMIT 1',
      [data.id],
    );
    const mutableColumns: readonly (readonly [string, unknown])[] = [
      ['identity_id', data.identityId],
      ['name', data.name],
      ['description', data.description],
      ['status', data.status],
      ['outcome', data.outcome],
      ['completion_policy', data.completionPolicy],
      ['closed_at', data.closedAt],
      ['archived_at', data.archivedAt],
      ['abandoned_reason', data.abandonedReason],
      ['importance', data.importance],
      ['color', data.color],
      ['tags', data.tags],
      ['time_config_type', data.timeConfigType],
      ['time_config_start_time', data.timeConfigStartTime],
      ['time_config_end_time', data.timeConfigEndTime],
      ['time_config_duration_minutes', data.timeConfigDurationMinutes],
      ['time_config_time_point', data.timeConfigTimePoint],
      ['time_config_time_range_start', data.timeConfigTimeRangeStart],
      ['time_config_time_range_end', data.timeConfigTimeRangeEnd],
      ['recurrence_rule_type', data.recurrenceRuleType],
      ['recurrence_rule_interval', data.recurrenceRuleInterval],
      ['recurrence_rule_days_of_week', data.recurrenceRuleDaysOfWeek],
      ['recurrence_rule_end_date', data.recurrenceRuleEndDate],
      ['recurrence_rule_count', data.recurrenceRuleCount],
      ['reminder_config_enabled', data.reminderConfigEnabled],
      ['reminder_config_time_offset_minutes', data.reminderConfigTimeOffsetMinutes],
      ['reminder_config_unit', data.reminderConfigUnit],
      ['reminder_config_channel', data.reminderConfigChannel],
      ['last_generated_date', data.lastGeneratedDate],
      ['generate_ahead_days', data.generateAheadDays],
      ['goal_id', data.goalId],
      ['key_result_id', data.keyResultId],
      ['goal_record_value', data.goalRecordValue],
      ['goal_progress_trigger', data.goalProgressTrigger],
      ['checklist', data.checklist],
      ['version', data.version],
      ['updated_at', data.updatedAt],
      ['deleted_at', data.deletedAt],
    ];

    if (existing) {
      await this.db.execute(
        `UPDATE task_templates SET ${mutableColumns.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...mutableColumns.map(([, value]) => value), data.id],
      );
      return;
    }

    const insertColumns: readonly (readonly [string, unknown])[] = [
      ['id', data.id],
      ...mutableColumns,
      ['created_at', data.createdAt],
    ];
    await this.db.execute(
      `INSERT INTO task_templates (${insertColumns.map(([column]) => column).join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
      insertColumns.map(([, value]) => value),
    );
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<TaskTemplate | null> {
    const row = await this.db.getOptional<PowerSyncTaskTemplateRow>(
      'SELECT * FROM task_templates WHERE id = ? AND identity_id = ? LIMIT 1',
      [id, identityId],
    );
    return row ? PowerSyncTaskTemplateMapper.toDomain(row) : null;
  }

  async findByIdWithChildren(identityId: string, id: string): Promise<TaskTemplate | null> {
    const template = await this.findByIdForIdentity(identityId, id);
    if (!template) return null;

    const instances = await this.db.getAll<PowerSyncTaskInstanceRow>(
      'SELECT * FROM task_instances WHERE template_id = ? AND identity_id = ? ORDER BY instance_date DESC',
      [id, identityId],
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


  async findByGoalId(identityId: string, goalId: string): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE identity_id = ? AND goal_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [identityId, goalId],
    );
  }

  async findByTags(identityId: string, tags: string[]): Promise<TaskTemplate[]> {
    const rows = await this.findByIdentityId(identityId);
    return rows.filter((template) => tags.some((tag) => template.tags.includes(tag)));
  }

  async findAllTemplateRefs(): Promise<Array<{ id: string; identityId: string }>> {
    // 本地 PowerSync 宿主不执行全量 reconcile（跨用户扫描需要服务端源）。
    return [];
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

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Task template not found for the current identity.');
    }
    await this.db.execute('DELETE FROM task_templates WHERE id = ? AND identity_id = ?', [
      id,
      identityId,
    ]);
  }

  async softDelete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Task template not found for the current identity.');
    }
    const now = new Date().toISOString();
    await this.db.execute(
      'UPDATE task_templates SET deleted_at = ?, updated_at = ? WHERE id = ? AND identity_id = ?',
      [now, now, id, identityId],
    );
  }

  async restore(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Task template not found for the current identity.');
    }
    await this.db.execute(
      'UPDATE task_templates SET deleted_at = NULL, archived_at = NULL, updated_at = ? WHERE id = ? AND identity_id = ?',
      [new Date().toISOString(), id, identityId],
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

  async findByKeyResultId(identityId: string, keyResultId: string): Promise<TaskTemplate[]> {
    return this.queryTemplates(
      'SELECT * FROM task_templates WHERE identity_id = ? AND key_result_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [identityId, keyResultId],
    );
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

  async deleteBatch(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.execute(
      `DELETE FROM task_templates WHERE identity_id = ? AND id IN (${placeholders})`,
      [identityId, ...ids],
    );
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
    return { clauses, params };
  }

  private async queryTemplates(sql: string, params: unknown[]): Promise<TaskTemplate[]> {
    const rows = await this.db.getAll<PowerSyncTaskTemplateRow>(sql, params);
    return rows.map((row) => PowerSyncTaskTemplateMapper.toDomain(row));
  }
}

