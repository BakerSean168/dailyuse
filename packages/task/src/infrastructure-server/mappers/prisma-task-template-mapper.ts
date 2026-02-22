/**
 * Prisma TaskTemplate Mapper
 *
 * Maps between TaskTemplate domain aggregate and Prisma model.
 * Handles JSON parsing for goalBinding field.
 */

import type { TaskTemplate as PrismaTaskTemplate } from '@dailyuse/database';
import { TaskTemplate } from '../../../domain-server/aggregates/task-template';

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
    return TaskTemplate.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      timeConfigType: data.timeConfigType,
      timeConfigStartTime: data.timeConfigStartTime ?? null,
      timeConfigEndTime: data.timeConfigEndTime ?? null,
      timeConfigDurationMinutes: data.timeConfigDurationMinutes,
      recurrenceRuleType: data.recurrenceRuleType,
      recurrenceRuleInterval: data.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: data.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: data.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: data.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: data.recurrenceRuleEndDate ?? null,
      recurrenceRuleCount: data.recurrenceRuleCount,
      reminderConfigEnabled: data.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: data.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: data.reminderConfigUnit,
      reminderConfigChannel: data.reminderConfigChannel,
      lastGeneratedDate: data.lastGeneratedDate ?? null,
      generateAheadDays: data.generateAheadDays,
      importance: data.importance,
      tags: data.tags,
      color: data.color,
      status: data.status,
      goalBinding: data.goalBinding ? JSON.parse(data.goalBinding) : null,
      parentTaskId: data.parentTaskId,
      dependencyStatus: data.dependencyStatus,
      isBlocked: data.isBlocked,
      blockingReason: data.blockingReason,
      folderId: data.folderId,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * TaskTemplate aggregate → Prisma write data
   */
  static toPersistence(dto: ReturnType<TaskTemplate['toPersistenceDTO']>) {
    return {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      importance: dto.importance,
      color: dto.color,
      tags: dto.tags,
      folderId: dto.folderId,
      parentTaskId: dto.parentTaskId,
      timeConfigType: dto.timeConfigType,
      timeConfigStartTime: toDate(dto.timeConfigStartTime),
      timeConfigEndTime: toDate(dto.timeConfigEndTime),
      timeConfigDurationMinutes: dto.timeConfigDurationMinutes,
      recurrenceRuleType: dto.recurrenceRuleType,
      recurrenceRuleInterval: dto.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: dto.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: dto.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: dto.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: toDate(dto.recurrenceRuleEndDate),
      recurrenceRuleCount: dto.recurrenceRuleCount,
      reminderConfigEnabled: dto.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: dto.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: dto.reminderConfigUnit,
      reminderConfigChannel: dto.reminderConfigChannel,
      lastGeneratedDate: toDate(dto.lastGeneratedDate),
      generateAheadDays: dto.generateAheadDays,
      goalBinding: dto.goalBinding ? JSON.stringify(dto.goalBinding) : null,
      dependencyStatus: dto.dependencyStatus ?? 'NONE',
      isBlocked: dto.isBlocked ?? false,
      blockingReason: dto.blockingReason,
      version: dto.version,
      deletedAt: dto.deletedAt,
    };
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaTaskTemplate[]): TaskTemplate[] {
    return rows.map((row) => PrismaTaskTemplateMapper.toDomain(row));
  }
}
