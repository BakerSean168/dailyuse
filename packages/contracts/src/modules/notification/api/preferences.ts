import { z } from 'zod';
import type { NotificationPreferenceServerDTO } from '../aggregates/notification-preference-server';

// ============ 更新通知偏好 ============

export const UpdateNotificationPreferenceSchema = z.object({
  enabled: z.boolean().optional(),
  channels: z.object({
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  categories: z.object({
    task: z.any().optional(),
    goal: z.any().optional(),
    schedule: z.any().optional(),
    reminder: z.any().optional(),
    account: z.any().optional(),
    system: z.any().optional(),
  }).optional(),
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

// ============ 获取通知偏好 ============

export type GetNotificationPreferenceReq = void;
export type GetNotificationPreferenceRes = NotificationPreferenceServerDTO;
