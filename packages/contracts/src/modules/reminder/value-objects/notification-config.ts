/**
 * Notification Config Value Object
 */

import type { NotificationChannel } from './notification-channel';
import type { NotificationAction } from './notification-action';

// ============ Sub-config Interfaces ============

/** Sound configuration. */
export interface SoundConfig {
  enabled: boolean;
  soundName: string | null;
}

/** Vibration configuration. */
export interface VibrationConfig {
  enabled: boolean;
  pattern: number[] | null;
}

/** Notification action configuration. */
export interface NotificationActionConfig {
  id: string;
  label: string;
  action: NotificationAction;
  customAction: string | null;
}

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

// ============ DTO Definitions ============

/**
 * Notification Config DTO
 */
export interface NotificationConfigDTO {
  channels: NotificationChannel[];
  title: string | null;
  body: string | null;
  sound: SoundConfig | null;
  vibration: VibrationConfig | null;
  actions: NotificationActionConfig[] | null;
}
