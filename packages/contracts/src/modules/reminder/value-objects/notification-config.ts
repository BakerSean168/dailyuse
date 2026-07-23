/**
 * Notification Config Value Object
 */

import { z } from 'zod';
import { NotificationChannel } from './notification-channel';
import { NotificationAction } from './notification-action';

// Residual 735: notification config dual bodies retired — OpenAPI + transport use
// NotificationConfigSchema (semantic types are z.infer aliases).

export const SoundConfigSchema = z.object({
  enabled: z.boolean(),
  soundName: z.string().nullable(),
});

export const VibrationConfigSchema = z.object({
  enabled: z.boolean(),
  pattern: z.array(z.number()).nullable(),
});

export const NotificationActionConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  action: z.enum(NotificationAction),
  customAction: z.string().nullable(),
});

export const NotificationConfigSchema = z.object({
  channels: z.array(z.enum(NotificationChannel)),
  title: z.string().nullable(),
  body: z.string().nullable(),
  sound: SoundConfigSchema.nullable(),
  vibration: VibrationConfigSchema.nullable(),
  actions: z.array(NotificationActionConfigSchema).nullable(),
});

export type SoundConfig = z.infer<typeof SoundConfigSchema>;
export type VibrationConfig = z.infer<typeof VibrationConfigSchema>;
export type NotificationActionConfig = z.infer<typeof NotificationActionConfigSchema>;
export type NotificationConfigDTO = z.infer<typeof NotificationConfigSchema>;

// ============ Interface Definitions ============

/** Notification config interface. */
export interface INotificationConfig {
  channels: NotificationChannel[];
  title: string | null;
  body: string | null;
  sound: SoundConfig | null;
  vibration: VibrationConfig | null;
  actions: NotificationActionConfig[] | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<INotificationConfig, 'equals' | 'with' | 'toDTO'>
    >,
  ): INotificationConfig;

  // DTO conversion methods
}
