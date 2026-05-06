/**
 * Notification Preference Operations
 *
 * This file contains DTOs for managing notification preferences and settings.
 * Includes channel preferences, do-not-disturb settings, and rate limiting.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { NotificationId, NotificationChannelId } from '../../../primitives';
import type { NotificationPreferenceServerDTO } from '../aggregates/notification-preference-server';
import type { NotificationStatsDTO } from '../dtos/notification-result.dto';
import type { SendNotificationResultDTO } from '../dtos/channel-result.dto';
import type { ListNotificationChannelsResultDTO } from '../dtos/channel-result.dto';
import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import { NotificationChannelType } from '../value-objects/notification-channel-type';

// ============================================================================
// PREFERENCE Operations
// ============================================================================

/**
 * 更新通知偏好 Schema
 */
export const UpdateNotificationPreferenceSchema = z.object({
  enabled: z.boolean().optional(),
  channels: z
    .object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
  categories: z
    .object({
      task: z.unknown().optional(),
      goal: z.unknown().optional(),
      schedule: z.unknown().optional(),
      reminder: z.unknown().optional(),
      account: z.unknown().optional(),
      system: z.unknown().optional(),
    })
    .optional(),
  doNotDisturb: z
    .object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      daysOfWeek: z.array(z.number().int().min(0).max(6)),
    })
    .optional(),
  rateLimit: z
    .object({
      enabled: z.boolean(),
      maxPerHour: z.number().int().min(1),
      maxPerDay: z.number().int().min(1),
    })
    .optional(),
});

export type UpdateNotificationPreferenceReq = z.infer<typeof UpdateNotificationPreferenceSchema>;
export type UpdateNotificationPreferenceRes = NotificationPreferenceServerDTO;

/**
 * 获取通知偏好
 */
export type GetNotificationPreferenceReq = void;
export type GetNotificationPreferenceRes = NotificationPreferenceServerDTO;

// ============================================================================
// Additional Operations
// ============================================================================

/**
 * 获取通知统计
 */
export type GetNotificationStatsReq = void;
export type GetNotificationStatsRes = NotificationStatsDTO;

/**
 * 执行通知操作 Schema
 */
export const ExecuteNotificationActionSchema = z.object({
  notificationId: brandedId<NotificationId>(),
  actionId: z.string(),
});

export type ExecuteNotificationActionReq = z.infer<typeof ExecuteNotificationActionSchema>;
export type ExecuteNotificationActionRes = NotificationServerDTO;

/**
 * 发送通知 Schema
 */
export const SendNotificationSchema = z.object({
  notificationId: brandedId<NotificationId>(),
  channels: z.array(z.enum(NotificationChannelType)).optional(),
});

export type SendNotificationReq = z.infer<typeof SendNotificationSchema>;
export type SendNotificationRes = SendNotificationResultDTO;

/**
 * 重试渠道 Schema
 */
export const RetryChannelSchema = z.object({
  channelId: brandedId<NotificationChannelId>(),
});

export type RetryChannelReq = z.infer<typeof RetryChannelSchema>;
export type RetryChannelRes = NotificationChannelServerDTO;

/**
 * 列表渠道
 */
export type ListNotificationChannelsReq = void;
export type ListNotificationChannelsRes = ListNotificationChannelsResultDTO;
