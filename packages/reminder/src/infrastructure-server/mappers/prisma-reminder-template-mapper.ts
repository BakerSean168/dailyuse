/**
 * Prisma ReminderTemplate Mapper
 *
 * Maps between ReminderTemplate domain aggregate and Prisma model.
 * Handles aggregate root + child entity (ReminderHistory) conversion.
 */

import type {
  ReminderTemplate as PrismaReminderTemplate,
  ReminderHistory as PrismaReminderHistory,
} from '@dailyuse/database';
import type { ReminderType, ReminderStatus, TriggerResult } from '@dailyuse/contracts/reminder';
import { ReminderTemplate } from '../../../domain-server/aggregates/reminder-template';
import { ReminderHistory } from '../../../domain-server/entities/reminder-history';

/**
 * Prisma ReminderTemplate with optional history relation
 */
export type PrismaReminderTemplateWithHistory = PrismaReminderTemplate & {
  history?: PrismaReminderHistory[];
};

export class PrismaReminderTemplateMapper {
  /**
   * Prisma record → ReminderTemplate aggregate root (with optional history)
   */
  static toDomain(data: PrismaReminderTemplate, historyRecords?: PrismaReminderHistory[]): ReminderTemplate {
    const template = ReminderTemplate.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description ?? null,
      type: data.type as ReminderType,
      trigger: data.trigger,
      recurrence: data.recurrence ?? null,
      activeTime: data.activeTime,
      activeHours: data.activeHours ?? null,
      notificationConfig: data.notificationConfig,
      selfEnabled: data.selfEnabled,
      status: data.status as ReminderStatus,
      groupId: data.reminderGroupId ?? null,
      importanceLevel: data.importanceLevel,
      tags: data.tags,
      color: data.color ?? null,
      icon: data.icon ?? null,
      nextTriggerAt: data.nextTriggerAt ?? null,
      stats: data.stats,

      // Smart Frequency: Response Metrics
      clickRate: data.clickRate ?? null,
      ignoreRate: data.ignoreRate ?? null,
      avgResponseTime: data.avgResponseTime ?? null,
      snoozeCount: data.snoozeCount ?? 0,
      effectivenessScore: data.effectivenessScore ?? null,
      sampleSize: data.sampleSize ?? 0,
      lastAnalysisTime: data.lastAnalysisTime ?? null,

      // Smart Frequency: Frequency Adjustment
      originalInterval: data.originalInterval ?? null,
      adjustedInterval: data.adjustedInterval ?? null,
      adjustmentReason: data.adjustmentReason ?? null,
      adjustmentTime: data.adjustmentTime ?? null,
      isAutoAdjusted: data.isAutoAdjusted ?? false,
      userConfirmed: data.userConfirmed ?? false,
      smartFrequencyEnabled: data.smartFrequencyEnabled ?? true,

      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });

    // Load child entities - history records
    if (historyRecords && historyRecords.length > 0) {
      for (const h of historyRecords) {
        const history = PrismaReminderTemplateMapper.mapHistory(h);
        template.addHistory(history);
      }
    }

    return template;
  }

  /**
   * Map a single Prisma ReminderHistory row to domain entity
   */
  static mapHistory(h: PrismaReminderHistory): ReminderHistory {
    return ReminderHistory.fromPersistenceDTO({
      id: h.id,
      templateId: h.templateId,
      triggeredAt: h.triggeredAt.getTime(),
      result: h.result as TriggerResult,
      error: h.error ?? null,
      notificationSent: h.notificationSent,
      notificationChannels: h.notificationChannel ?? null,
      createdAt: h.createdAt,
    });
  }

  /**
   * ReminderTemplate aggregate → Prisma write data
   */
  static toPersistence(template: ReminderTemplate) {
    const dto = template.toPersistenceDTO();
    return {
      identityId: dto.identityId as string,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      trigger: dto.trigger,
      recurrence: dto.recurrence,
      activeTime: dto.activeTime,
      activeHours: dto.activeHours,
      notificationConfig: dto.notificationConfig,
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      reminderGroupId: dto.groupId,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats: dto.stats,

      // Smart Frequency: Response Metrics
      clickRate: dto.clickRate ?? null,
      ignoreRate: dto.ignoreRate ?? null,
      avgResponseTime: dto.avgResponseTime ?? null,
      snoozeCount: dto.snoozeCount ?? 0,
      effectivenessScore: dto.effectivenessScore ?? null,
      sampleSize: dto.sampleSize ?? 0,
      lastAnalysisTime: dto.lastAnalysisTime ?? null,

      // Smart Frequency: Frequency Adjustment
      originalInterval: dto.originalInterval ?? null,
      adjustedInterval: dto.adjustedInterval ?? null,
      adjustmentReason: dto.adjustmentReason ?? null,
      adjustmentTime: dto.adjustmentTime ?? null,
      isAutoAdjusted: dto.isAutoAdjusted ?? false,
      userConfirmed: dto.userConfirmed ?? false,
      smartFrequencyEnabled: dto.smartFrequencyEnabled ?? true,

      version: dto.version,
      deletedAt: dto.deletedAt,
    };
  }
}
