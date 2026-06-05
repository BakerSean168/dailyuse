/**
 * Portable Settings DTOs
 */

import { z } from 'zod';

export const PortableSettingsSchema = z
  .object({
    preferences: z.record(z.string(), z.unknown()),
  })
  .strict();

export type PortableSettings = z.infer<typeof PortableSettingsSchema>;

export const PortableNotificationPreferenceSchema = z
  .object({
    channels: z.unknown(),
    categories: z.unknown(),
    doNotDisturb: z.unknown().optional(),
    rateLimit: z.unknown().optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export type PortableNotificationPreference = z.infer<typeof PortableNotificationPreferenceSchema>;

export const PortableUserReminderPreferenceSchema = z
  .object({
    bestTimeSlots: z.array(z.unknown()),
    worstTimeSlots: z.array(z.unknown()),
    globalReminderEnabled: z.boolean(),
    globalSmartFrequency: z.boolean(),
  })
  .strict();

export type PortableUserReminderPreference = z.infer<typeof PortableUserReminderPreferenceSchema>;
