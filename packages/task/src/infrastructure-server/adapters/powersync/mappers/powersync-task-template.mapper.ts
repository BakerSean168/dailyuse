import { TaskTemplate } from '../../../../domain-server/aggregates/task-template';
import type { TaskTemplateState } from '../../../../domain-server/aggregates/task-template';
import { TaskFolderId } from '../../../../domain-shared/value-objects/task-folder-id';
import { TaskTemplateId } from '../../../../domain-shared/value-objects/task-template-id';
import { TaskTemplateStatus } from '../../../../domain-shared/value-objects/task-template-status';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskType } from '@dailyuse/contracts/task';
import type { DependencyStatus, RecurrenceFrequency, ReminderTimeUnit } from '@dailyuse/contracts/task';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import {
  ChecklistItemDefinition,
  RecurrenceRule,
  TaskGoalBinding,
  TaskReminderConfig,
} from '../../../../domain-server/value-objects';
import { TaskTimeConfig } from '../../../../domain-shared/value-objects/task-time-config';

export type PowerSyncTaskTemplateRow = {
  id: string;
  identity_id: string;
  name: string;
  description: string | null;
  status: string;
  importance: string;
  priority: number | null;
  color: string | null;
  tags: string | null;
  folder_id: string | null;
  parent_task_id: string | null;
  time_config_type: string | null;
  time_config_start_time: string | null;
  time_config_end_time: string | null;
  time_config_duration_minutes: number | null;
  time_config_time_point: number | null;
  time_config_time_range_start: number | null;
  time_config_time_range_end: number | null;
  recurrence_rule_type: string | null;
  recurrence_rule_interval: number | null;
  recurrence_rule_days_of_week: string | null;
  recurrence_rule_day_of_month: number | null;
  recurrence_rule_month_of_year: number | null;
  recurrence_rule_end_date: string | null;
  recurrence_rule_count: number | null;
  reminder_config_enabled: number | boolean | null;
  reminder_config_time_offset_minutes: number | null;
  reminder_config_unit: string | null;
  reminder_config_channel: string | null;
  last_generated_date: string | null;
  generate_ahead_days: number | null;
  goal_binding: string | null;
  checklist: string | null;
  blocking_reason: string | null;
  dependency_status: string | null;
  is_blocked: number | boolean | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class PowerSyncTaskTemplateMapper {
  static toDomain(data: PowerSyncTaskTemplateRow): TaskTemplate {
    const startDate = data.time_config_start_time
      ? new Date(data.time_config_start_time).getTime()
      : null;
    const _endDate = data.time_config_end_time
      ? new Date(data.time_config_end_time).getTime()
      : null;

    const timeConfig = data.time_config_type
      ? TaskTimeConfig.fromDTO({
          timeType: data.time_config_type,
          startDate,
          timePoint: data.time_config_time_point,
          timeRange:
            data.time_config_time_range_start != null && data.time_config_time_range_end != null
              ? {
                  start: data.time_config_time_range_start,
                  end: data.time_config_time_range_end,
                }
              : null,
        })
      : null;

    const recurrenceRule = data.recurrence_rule_type
      ? RecurrenceRule.fromDTO({
          frequency: data.recurrence_rule_type as RecurrenceFrequency,
          interval: data.recurrence_rule_interval ?? 1,
          daysOfWeek: data.recurrence_rule_days_of_week
            ? JSON.parse(data.recurrence_rule_days_of_week)
            : [],
          endDate: data.recurrence_rule_end_date
            ? new Date(data.recurrence_rule_end_date).getTime()
            : null,
          occurrences: data.recurrence_rule_count ?? null,
        })
      : null;

    const reminderConfig =
      data.reminder_config_enabled === true || data.reminder_config_enabled === 1
        ? TaskReminderConfig.fromDTO({
            enabled: true,
            triggers: [
              {
                type: 'Relative',
                absoluteTime: null,
                relativeValue: data.reminder_config_time_offset_minutes ?? 0,
                relativeUnit: (data.reminder_config_unit as ReminderTimeUnit) ?? 'Minutes',
              },
            ],
          })
        : null;

    const state: TaskTemplateState = {
      id: TaskTemplateId.of(data.id),
      identityId: IdentityId.of(data.identity_id),
      title: data.name,
      description: data.description ?? null,
      taskType: recurrenceRule ? TaskType.Recurring : TaskType.OneTime,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: data.importance as ImportanceLevel,
      tags: data.tags ? (JSON.parse(data.tags) as string[]) : [],
      color: data.color ?? null,
      status: (data.status as TaskTemplateStatus) ?? TaskTemplateStatus.Active,
      folderId: data.folder_id ? TaskFolderId.of(data.folder_id) : null,
      goalId: null,
      keyResultId: null,
      goalBinding: data.goal_binding
        ? TaskGoalBinding.fromDTO(JSON.parse(data.goal_binding))
        : null,
      checklist: data.checklist
        ? (JSON.parse(data.checklist) as Array<{ title: string; order: number }>).map((item) =>
            ChecklistItemDefinition.fromDTO(item),
          )
        : [],
      parentTaskId: data.parent_task_id ? TaskTemplateId.of(data.parent_task_id) : null,
      lastGeneratedDate: data.last_generated_date ? new Date(data.last_generated_date) : null,
      generateAheadDays: data.generate_ahead_days ?? null,
      startDate: null,
      dueDate: null,
      completedAt: null,
      estimatedMinutes: null,
      actualMinutes: null,
      note: null,
      dependencyStatus: (data.dependency_status ?? 'NONE') as DependencyStatus,
      isBlocked: data.is_blocked === true || data.is_blocked === 1,
      blockingReason: data.blocking_reason ?? null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
      version: data.version ?? 1,
    };

    return TaskTemplate.load(state);
  }

  static toPersistence(template: TaskTemplate) {
    const dto = template.toServerDTO();
    const timeConfig = dto.timeConfig;
    const recurrenceRule = dto.recurrenceRule;
    const reminderTrigger = dto.reminderConfig?.triggers?.[0] ?? null;

    return {
      id: String(dto.id),
      identityId: String(dto.identityId),
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status,
      importance: dto.importance,
      priority: dto.priority ?? null,
      color: dto.color ?? null,
      tags: JSON.stringify(dto.tags ?? []),
      folderId: dto.folderId ?? null,
      parentTaskId: dto.parentTaskId ?? null,
      timeConfigType: timeConfig?.timeType ?? null,
      timeConfigStartTime:
        timeConfig?.startDate != null ? new Date(timeConfig.startDate).toISOString() : null,
      timeConfigEndTime: null,
      timeConfigDurationMinutes:
        timeConfig?.timeRange != null
          ? timeConfig.timeRange.end - timeConfig.timeRange.start
          : null,
      timeConfigTimePoint: timeConfig?.timePoint ?? null,
      timeConfigTimeRangeStart: timeConfig?.timeRange?.start ?? null,
      timeConfigTimeRangeEnd: timeConfig?.timeRange?.end ?? null,
      recurrenceRuleType: recurrenceRule?.frequency ?? null,
      recurrenceRuleInterval: recurrenceRule?.interval ?? null,
      recurrenceRuleDaysOfWeek: recurrenceRule?.daysOfWeek
        ? JSON.stringify(recurrenceRule.daysOfWeek)
        : null,
      recurrenceRuleDayOfMonth: null,
      recurrenceRuleMonthOfYear: null,
      recurrenceRuleEndDate:
        recurrenceRule?.endDate != null ? new Date(recurrenceRule.endDate).toISOString() : null,
      recurrenceRuleCount: recurrenceRule?.occurrences ?? null,
      reminderConfigEnabled: dto.reminderConfig?.enabled ? 1 : 0,
      reminderConfigTimeOffsetMinutes: reminderTrigger?.relativeValue ?? null,
      reminderConfigUnit: reminderTrigger?.relativeUnit ?? null,
      reminderConfigChannel: reminderTrigger ? 'PUSH' : null,
      lastGeneratedDate:
        dto.lastGeneratedDate != null ? new Date(dto.lastGeneratedDate).toISOString() : null,
      generateAheadDays: dto.generateAheadDays ?? null,
      goalBinding: dto.goalBinding ? JSON.stringify(dto.goalBinding) : null,
      checklist: dto.checklist?.length ? JSON.stringify(dto.checklist) : null,
      blockingReason: dto.blockingReason ?? null,
      dependencyStatus: dto.dependencyStatus ?? 'NONE',
      isBlocked: dto.isBlocked ? 1 : 0,
      version: dto.version,
      createdAt: new Date(dto.createdAt).toISOString(),
      updatedAt: new Date(dto.updatedAt).toISOString(),
      deletedAt: dto.deletedAt != null ? new Date(dto.deletedAt).toISOString() : null,
    };
  }
}
