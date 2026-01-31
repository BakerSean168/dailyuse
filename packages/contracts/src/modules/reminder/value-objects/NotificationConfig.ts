/**
 * Notification Config Value Object
 * 通知配置值对象
 */

import type { NotificationChannel, NotificationAction } from '../enums';

// ============ 子配置接口 ============

/**
 * 声音配置
 */
export interface SoundConfig {
  enabled: boolean;
  soundName?: string | null;
}

/**
 * 震动配置
 */
export interface VibrationConfig {
  enabled: boolean;
  pattern?: number[] | null;
}

/**
 * 通知操作
 */
export interface NotificationActionConfig {
  id: string;
  label: string;
  action: NotificationAction;
  customAction?: string | null;
}

// ============ 接口定义 ============

/**
 * 通知配置 - Server 接口
 */
export interface INotificationConfigServer {
  channels: NotificationChannel[];
  title?: string | null;
  body?: string | null;
  sound?: SoundConfig | null;
  vibration?: VibrationConfig | null;
  actions?: NotificationActionConfig[] | null;

  // 值对象方法
  equals(other: INotificationConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationConfigServer;

  // DTO 转换方法}

/**
 * 通知配置 - Client 接口
 */
export interface INotificationConfigClient {
  channels: NotificationChannel[];
  title?: string | null;
  body?: string | null;
  sound?: SoundConfig | null;
  vibration?: VibrationConfig | null;
  actions?: NotificationActionConfig[] | null;

  // UI 辅助属性
  channelsText: string; // "应用内 + 推送"
  hasSoundEnabled: boolean;
  hasVibrationEnabled: boolean;

  // 值对象方法
  equals(other: INotificationConfigClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Notification Config Server DTO
 */
export interface NotificationConfigServerDTO {
  channels: NotificationChannel[];
  title?: string | null;
  body?: string | null;
  sound?: SoundConfig | null;
  vibration?: VibrationConfig | null;
  actions?: NotificationActionConfig[] | null;
}

/**
 * Notification Config Client DTO
 */
export interface NotificationConfigClientDTO {
  channels: NotificationChannel[];
  title?: string | null;
  body?: string | null;
  sound?: SoundConfig | null;
  vibration?: VibrationConfig | null;
  actions?: NotificationActionConfig[] | null;
  channelsText: string;
  hasSoundEnabled: boolean;
  hasVibrationEnabled: boolean;
}

/**
 * Notification Config Persistence DTO
 */
export interface NotificationConfigPersistenceDTO {
  channels: string; // JSON string
  title?: string | null;
  body?: string | null;
  sound?: string | null; // JSON string
  vibration?: string | null; // JSON string
  actions?: string | null; // JSON string
}

// ============ 类型导出 ============

export type NotificationConfigServer = INotificationConfigServer;
export type NotificationConfigClient = INotificationConfigClient;
