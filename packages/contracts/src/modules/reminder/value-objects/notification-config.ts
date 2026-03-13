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

/** Notification config - Server interface. */
export interface INotificationConfigServer {
  channels: NotificationChannel[];
  title: string | null;
  body: string | null;
  sound: SoundConfig | null;
  vibration: VibrationConfig | null;
  actions: NotificationActionConfig[] | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        INotificationConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationConfigServer;

  // DTO conversion methods
}

/** Notification config - Client interface. */
export interface INotificationConfigClient {
  channels: NotificationChannel[];
  title: string | null;
  body: string | null;
  sound: SoundConfig | null;
  vibration: VibrationConfig | null;
  actions: NotificationActionConfig[] | null;

  // UI helper properties
  channelsText: string; // "In-app + Push"
  hasSoundEnabled: boolean;
  hasVibrationEnabled: boolean;

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Notification Config Server DTO
 */
export interface NotificationConfigServerDTO {
  channels: NotificationChannel[];
  title: string | null;
  body: string | null;
  sound: SoundConfig | null;
  vibration: VibrationConfig | null;
  actions: NotificationActionConfig[] | null;
}

/**
 * Notification Config Client DTO
 */
export interface NotificationConfigClientDTO {
  channels: NotificationChannel[];
  title: string | null;
  body: string | null;
  sound: SoundConfig | null;
  vibration: VibrationConfig | null;
  actions: NotificationActionConfig[] | null;
  channelsText: string;
  hasSoundEnabled: boolean;
  hasVibrationEnabled: boolean;
}

/**
 * Notification Config Persistence DTO
 */
export interface NotificationConfigPersistenceDTO {
  channels: string; // JSON string
  title: string | null;
  body: string | null;
  sound: string | null; // JSON string
  vibration: string | null; // JSON string
  actions: string | null; // JSON string
}

// ============ Type Exports ============

export type NotificationConfigServer = INotificationConfigServer;
export type NotificationConfigClient = INotificationConfigClient;
