/**
 * Prisma TaskTemplate Mapper
 *
 * Maps between TaskTemplate domain aggregate and Prisma model.
 * Handles JSON parsing for goalBinding field and flattened field reconstruction.
 */

import type { TaskTemplate as PrismaTaskTemplate } from '@dailyuse/database';
import { TaskTemplate } from '@/domain-server/aggregates/task-template';
import type { TaskTemplateServerDTO } from '@dailyuse/contracts/task';
import { RecurrenceFrequency } from '@dailyuse/contracts/task';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateId } from '@/domain-shared/value-objects/task-template-id';
import { TaskFolderId } from '@/domain-shared/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskTemplateStatus } from '@/domain-shared/value-objects/task-template-status';
import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from '@/domain-server/value-objects';

/**
 * Safely convert a Date, number (timestamp), or string to a Date object.
 * Returns null if the input is falsy.
 */
function toDate(value: Date | number | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export class PrismaTaskTemplateMapper {
  /**
   * Prisma record → TaskTemplate aggregate root
   */
  static toDomain(data: PrismaTaskTemplate): TaskTemplate {
    let timeConfig = null;
    if (data.timeConfigType) {
      timeConfig = TaskTimeConfig.create({
        timeType: data.timeConfigType as any,
        startDate: data.timeConfigStartTime ? data.timeConfigStartTime.getTime() : null,
        timePoint: null,
        timeRange: null,
      });
    }

    let recurrenceRule = null;
    if (data.recurrenceRuleType) {
      recurrenceRule = RecurrenceRule.create({
        frequency: data.recurrenceRuleType as RecurrenceFrequency,
        interval: data.recurrenceRuleInterval ?? 1,
        daysOfWeek: data.recurrenceRuleDaysOfWeek ? JSON.parse(data.recurrenceRuleDaysOfWeek) : [],
        endDate: data.recurrenceRuleEndDate ? data.recurrenceRuleEndDate.getTime() : null,
        occurrences: data.recurrenceRuleCount,
      });
    }

    let reminderConfig = null;
    if (data.reminderConfigEnabled) {
      const triggers = [
        {
          type: 'Relative' as const,
          absoluteTime: null,
          relativeValue: data.reminderConfigTimeOffsetMinutes,
          relativeUnit: data.reminderConfigUnit as any,
        },
      ];
      reminderConfig = TaskReminderConfig.create({
        enabled: data.reminderConfigEnabled,
        triggers,
      });
    }

    let goalBinding = null;
    if (data.goalBinding) {
      goalBinding = TaskGoalBinding.fromDTO(
        typeof data.goalBinding === 'string' ? JSON.parse(data.goalBinding) : data.goalBinding,
      );
    }

    const tags = data.tags ? JSON.parse(data.tags) : [];

    return TaskTemplate.load({
      id: TaskTemplateId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      title: data.name,
      description: data.description,
      taskType: recurrenceRule ? 'RECURRING' : 'ONE_TIME',
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: data.importance as ImportanceLevel,
      goalBinding,
      goalId: null,
      keyResultId: null,
      checklist: [],
      folderId: data.folderId ? TaskFolderId.of(data.folderId) : null,
      tags,
      color: data.color,
      status: data.status as TaskTemplateStatus,
      lastGeneratedDate: data.lastGeneratedDate ?? null,
      generateAheadDays: data.generateAheadDays,
      parentTaskId: data.parentTaskId ? TaskTemplateId.of(data.parentTaskId) : null,
      dependencyStatus: data.dependencyStatus ?? 'NONE',
      isBlocked: data.isBlocked ?? false,
      blockingReason: data.blockingReason,
      startDate: null,
      dueDate: null,
      completedAt: null,
      estimatedMinutes: null,
      actualMinutes: null,
      note: null,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * TaskTemplate ServerDTO → Prisma write data
   */
  static toPersistence(dto: TaskTemplateServerDTO) {
    // Flatten nested timeConfig
    const timeConfigType = dto.timeConfig?.timeType ?? null;
    const timeConfigStartTime = toDate(dto.timeConfig?.startDate);
    const timeConfigEndTime = null;
    const timeConfigDurationMinutes =
      dto.timeConfig?.timeRange?.end && dto.timeConfig?.timeRange?.start
        ? (dto.timeConfig.timeRange.end - dto.timeConfig.timeRange.start) / 60000
        : null;

    // Flatten nested recurrenceRule
    const recurrenceRuleType = dto.recurrenceRule?.frequency ?? null;
    const recurrenceRuleInterval = dto.recurrenceRule?.interval ?? null;
    const recurrenceRuleDaysOfWeek = dto.recurrenceRule?.daysOfWeek
      ? JSON.stringify(dto.recurrenceRule.daysOfWeek)
      : null;
    const recurrenceRuleEndDate = toDate(dto.recurrenceRule?.endDate);
    const recurrenceRuleCount = dto.recurrenceRule?.occurrences ?? null;

    // Flatten nested reminderConfig
    const reminderConfigEnabled = dto.reminderConfig?.enabled ?? null;
    const reminderConfigTimeOffsetMinutes = dto.reminderConfig?.triggers?.[0]?.relativeValue ?? null;
    const reminderConfigUnit = dto.reminderConfig?.triggers?.[0]?.relativeUnit ?? null;
    const reminderConfigChannel = dto.reminderConfig ? 'PUSH' : null;

    return {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      importance: dto.importance,
      color: dto.color,
      tags: typeof dto.tags === 'string' ? dto.tags : JSON.stringify(dto.tags),
      folderId: dto.folderId,
      parentTaskId: dto.parentTaskId,
      timeConfigType,
      timeConfigStartTime,
      timeConfigEndTime,
      timeConfigDurationMinutes,
      recurrenceRuleType,
      recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: null,
      recurrenceRuleMonthOfYear: null,
      recurrenceRuleEndDate,
      recurrenceRuleCount,
      reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes,
      reminderConfigUnit,
      reminderConfigChannel,
      lastGeneratedDate: toDate(dto.lastGeneratedDate),
      generateAheadDays: dto.generateAheadDays,
      goalBinding: dto.goalBinding ? JSON.stringify(dto.goalBinding) : null,
      dependencyStatus: dto.dependencyStatus ?? 'NONE',
      isBlocked: dto.isBlocked ?? false,
      blockingReason: dto.blockingReason,
      version: dto.version,
      deletedAt: toDate(dto.deletedAt),
    };
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaTaskTemplate[]): TaskTemplate[] {
    return rows.map((row) => PrismaTaskTemplateMapper.toDomain(row));
  }
}
