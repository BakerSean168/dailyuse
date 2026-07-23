/**
 * Reminder - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，路由文件统一从此处导入。
 * Schema 必须与对应的 ClientDTO 严格对齐，不得使用影子结构。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  ReminderTemplateId,
  ReminderGroupId,
  IdentityId,
  ReminderHistoryId,
  ReminderResponseId,
  UserReminderPreferencesId,
} from '../../../primitives';
import { ReminderType } from '../value-objects/reminder-type';
import { ReminderStatus } from '../value-objects/reminder-status';
import { TriggerType } from '../value-objects/trigger-type';
import { TriggerResult } from '../value-objects/trigger-result';
import { NotificationChannel } from '../value-objects/notification-channel';
import { NotificationAction } from '../value-objects/notification-action';
import { ControlMode } from '../value-objects/control-mode';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { ActiveHoursConfigSchema } from '../value-objects/active-hours-config';
import { GroupStatsSchema } from '../value-objects/group-stats';

// Residual 733: ActiveHoursConfigSchema / GroupStatsSchema owned by value-objects
// (re-exported for OpenAPI nested response consumers).
export { ActiveHoursConfigSchema, GroupStatsSchema };

// ============ 值对象 Zod Schema ============

const TriggerConfigSchema = z.object({
  type: z.enum(TriggerType),
  fixedTime: z
    .object({
      time: z.string(),
      timezone: z.string().nullable(),
    })
    .nullable(),
  interval: z
    .object({
      minutes: z.number(),
      startTime: z.number().nullable(),
    })
    .nullable(),
});

const NotificationConfigSchema = z.object({
  channels: z.array(z.enum(NotificationChannel)),
  title: z.string().nullable(),
  body: z.string().nullable(),
  sound: z
    .object({
      enabled: z.boolean(),
      soundName: z.string().nullable(),
    })
    .nullable(),
  vibration: z
    .object({
      enabled: z.boolean(),
      pattern: z.array(z.number()).nullable(),
    })
    .nullable(),
  actions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        action: z.enum(NotificationAction),
        customAction: z.string().nullable(),
      }),
    )
    .nullable(),
});

const ActiveTimeConfigSchema = z.object({
  startDate: z.number(),
  endDate: z.number().nullable(),
});


// ============ ReminderTemplate Response Schema ============

/**
 * 与 ReminderTemplateClientDTO 严格对齐的响应 schema。
 */
export const ReminderTemplateResponseSchema = z.object({
  id: brandedId<ReminderTemplateId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(ReminderType),
  trigger: TriggerConfigSchema,
  activeTime: ActiveTimeConfigSchema,
  activeHours: ActiveHoursConfigSchema.nullable(),
  notificationConfig: NotificationConfigSchema,
  selfEnabled: z.boolean(),
  status: z.enum(ReminderStatus),
  effectiveEnabled: z.boolean(),
  groupId: brandedId<ReminderGroupId>().nullable(),
  groupName: z.string().nullable().optional(),
  importanceLevel: z.enum(ImportanceLevel),
  tags: z.array(z.string()),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  nextTriggerAt: z.number().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  // history 子实体（可选加载）
  history: z.array(z.lazy(() => ReminderHistoryResponseSchema)).nullable(),
  // UI 扩展
  isActive: z.boolean(),
  isPaused: z.boolean(),
  controlledByGroup: z.boolean(),
  lifecycleSource: z.enum(['global', 'group', 'template']),
  effectiveEnabledReason: z.string(),
  groupControlMode: z.enum(['Group', 'Individual']).nullable(),
  groupEnabled: z.boolean().nullable(),
  globalReminderEnabled: z.boolean(),
});

// Residual 693: reminder list OpenAPI schemas are the sole list response shapes
// (ReminderTemplateListRes / ReminderGroupListRes are z.infer aliases).
export const ReminderTemplateListResponseSchema = z.object({
  templates: z.array(ReminderTemplateResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});

// ============ ReminderGroup Response Schema ============

/**
 * 与 ReminderGroupClientDTO 严格对齐的响应 schema。
 */
export const ReminderGroupResponseSchema = z.object({
  id: brandedId<ReminderGroupId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  controlMode: z.enum(ControlMode),
  enabled: z.boolean(),
  status: z.enum(ReminderStatus),
  order: z.number(),
  stats: GroupStatsSchema,
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

export const ReminderGroupListResponseSchema = z.object({
  groups: z.array(ReminderGroupResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});

// ============ ReminderHistory Response Schema ============

export const ReminderHistoryResponseSchema = z.object({
  id: brandedId<ReminderHistoryId>(),
  templateId: brandedId<ReminderTemplateId>(),
  triggeredAt: z.number(),
  result: z.enum(TriggerResult),
  error: z.string().nullable(),
  notificationSent: z.boolean(),
  notificationChannels: z.array(z.enum(NotificationChannel)).nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

// ============ ReminderResponse Response Schema ============

export const ReminderResponseItemSchema = z.object({
  id: brandedId<ReminderResponseId>(),
  reminderTemplateId: brandedId<ReminderTemplateId>(),
  action: z.string(),
  responseTime: z.number().nullable().optional(),
  timestamp: z.number(),
});

// ============ Batch Result Schema ============

export const ReminderBatchResultSchema = z.object({
  successCount: z.number(),
  failedCount: z.number(),
});

// ============ UserReminderPreferences Response Schema ============

const TimeSlotSchema = z.object({
  hourStart: z.number(),
  hourEnd: z.number(),
  avgResponseRate: z.number(),
  sampleCount: z.number(),
});

export const UserReminderPreferencesResponseSchema = z.object({
  id: brandedId<UserReminderPreferencesId>(),
  identityId: brandedId<IdentityId>(),
  bestTimeSlots: z.array(TimeSlotSchema),
  worstTimeSlots: z.array(TimeSlotSchema),
  globalReminderEnabled: z.boolean(),
  globalSmartFrequency: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
  bestTimeSlotsText: z.string(),
  worstTimeSlotsText: z.string(),
  summaryText: z.string().optional(),
});

export const UpdateReminderPreferencesSchema = z.object({
  bestTimeSlots: z.array(TimeSlotSchema).optional(),
  worstTimeSlots: z.array(TimeSlotSchema).optional(),
  globalReminderEnabled: z.boolean().optional(),
  globalSmartFrequencyEnabled: z.boolean().optional(),
});

export type UpdateReminderPreferencesReq = z.infer<typeof UpdateReminderPreferencesSchema>;

// ============ Response Operation Schemas ============

export const ResponseRecordResultSchema = z.object({
  id: brandedId<ReminderResponseId>(),
  templateId: brandedId<ReminderTemplateId>(),
  action: z.string(),
  responseTime: z.number().nullable(),
  recordedAt: z.number(),
});

export const ResponseStatsResultSchema = z.object({
  total: z.number(),
  clicked: z.number(),
  ignored: z.number(),
  snoozed: z.number(),
  dismissed: z.number(),
  completed: z.number(),
  avgResponseTime: z.number(),
});

// ============ Frequency Analysis Schemas ============

export const FrequencyAnalysisResultSchema = z.object({
  clickRate: z.number(),
  ignoreRate: z.number(),
  avgResponseTime: z.number(),
  snoozeCount: z.number(),
  effectivenessScore: z.number(),
  sampleSize: z.number(),
  lastAnalysisTime: z.number(),
});

export const FrequencyAdjustmentResultSchema = z.object({
  templateId: brandedId<ReminderTemplateId>(),
  originalInterval: z.number(),
  adjustedInterval: z.number(),
  reason: z.string(),
  appliedAt: z.number(),
});