import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { NotificationId, NotificationChannelId } from '../../../primitives';
import type { NotificationPreferenceServerDTO } from '../aggregates/notification-preference-server';
import type { NotificationStatsDTO } from '../dtos/notification-result.dto';
import type { SendNotificationResultDTO, ListNotificationChannelsResultDTO } from '../dtos/channel-result.dto';
import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import { NotificationChannelType } from '../value-objects/notification-channel-type';

const ChannelPreferenceFlagsSchema = z.object({
  InApp: z.boolean().optional(),
  Email: z.boolean().optional(),
  Push: z.boolean().optional(),
  Desktop: z.boolean().optional(),
  Sms: z.boolean().optional(),
  Webhook: z.boolean().optional(),
});

/** User-owned layers only: global channel choice and workflow-specific overrides. */
export const UpdateNotificationPreferenceSchema = z.object({
  globalChannels: ChannelPreferenceFlagsSchema.optional(),
  workflowOverrides: z.record(z.string(), ChannelPreferenceFlagsSchema).optional(),
  doNotDisturb: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
  }).optional(),
  rateLimit: z.object({
    enabled: z.boolean(),
    maxPerHour: z.number().int().min(1),
    maxPerDay: z.number().int().min(1),
  }).optional(),
});
export type UpdateNotificationPreferenceReq = z.infer<typeof UpdateNotificationPreferenceSchema>;
export type UpdateNotificationPreferenceRes = NotificationPreferenceServerDTO;
export type GetNotificationPreferenceReq = void;
export type GetNotificationPreferenceRes = NotificationPreferenceServerDTO;
export type GetNotificationStatsReq = void;
export type GetNotificationStatsRes = NotificationStatsDTO;

export const ExecuteNotificationActionSchema = z.object({
  notificationId: brandedId<NotificationId>(),
  actionId: z.string(),
});
export type ExecuteNotificationActionReq = z.infer<typeof ExecuteNotificationActionSchema>;
export type ExecuteNotificationActionRes = NotificationServerDTO;

export const SendNotificationSchema = z.object({
  notificationId: brandedId<NotificationId>(),
  channels: z.array(z.enum(NotificationChannelType)).optional(),
});
export type SendNotificationReq = z.infer<typeof SendNotificationSchema>;
export type SendNotificationRes = SendNotificationResultDTO;

export const RetryChannelSchema = z.object({ channelId: brandedId<NotificationChannelId>() });
export type RetryChannelReq = z.infer<typeof RetryChannelSchema>;
export type RetryChannelRes = NotificationChannelServerDTO;
export type ListNotificationChannelsReq = void;
export type ListNotificationChannelsRes = ListNotificationChannelsResultDTO;
