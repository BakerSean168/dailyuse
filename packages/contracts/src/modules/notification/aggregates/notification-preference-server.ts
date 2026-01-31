/**
 * NotificationPreference Aggregate Root - Server Interface
 * 通知偏好聚合根 - 服务端接口
 */

import type { NotificationCategory } from '../enums';
import type {
  CategoryPreferenceServer,
  CategoryPreferenceServerDTO,
  DoNotDisturbConfigServerDTO,
  RateLimitServer,
  RateLimitServerDTO,
} from '../value-objects';

// ============ 辅助类型 ============

/**
 * 渠道配置
 */
export interface ChannelPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * 分类偏好配置
 */
export interface CategoryPreferences {
  task: CategoryPreferenceServer;
  goal: CategoryPreferenceServer;
  schedule: CategoryPreferenceServer;
  reminder: CategoryPreferenceServer;
  account: CategoryPreferenceServer;
  system: CategoryPreferenceServer;
}

// ============ DTO 定义 ============

/**
 * NotificationPreference Server DTO
 */
export interface NotificationPreferenceServerDTO {
  uuid: string;
  accountUuid: string;
  enabled: boolean;
  channels: ChannelPreferences;
  categories: CategoryPreferences;
  doNotDisturb?: DoNotDisturbConfigServerDTO | null;
  rateLimit?: RateLimitServerDTO | null;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * NotificationPreference Persistence DTO (数据库映射)
 */
export interface NotificationPreferencePersistenceDTO {
  uuid: string;
  accountUuid: string;
  enabled: boolean;
  channels: string; // JSON string
  categories: string; // JSON string
  doNotDisturb?: string | null; // JSON string
  rateLimit?: string | null; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

// ============ 领域事件 ============

/**
 * 偏好创建事件
 */
export interface NotificationPreferenceCreatedEvent {
  type: 'notification.preference.created';
  aggregateId: string; // preferenceUuid
  timestamp: Date; // epoch ms
  payload: {
    preference: NotificationPreferenceServerDTO;
  };
}

/**
 * 偏好更新事件
 */
export interface NotificationPreferenceUpdatedEvent {
  type: 'notification.preference.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    preference: NotificationPreferenceServerDTO;
    changes: string[];
  };
}

/**
 * NotificationPreference 领域事件联合类型
 */
export type NotificationPreferenceDomainEvent =
  | NotificationPreferenceCreatedEvent
  | NotificationPreferenceUpdatedEvent;

// ============ 实体接口 ============

/**
 * NotificationPreference 聚合根 - Server 接口（实例方法）
 */
export interface NotificationPreferenceServer {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  enabled: boolean;

  // ===== 渠道开关 =====
  channels: ChannelPreferences;

  // ===== 分类偏好 =====
  categories: CategoryPreferences;

  // ===== 免打扰设置（值对象） =====
  doNotDisturb?: DoNotDisturbConfigServerDTO | null;

  // ===== 频率限制（值对象） =====
  rateLimit?: RateLimitServer | null;

  // ===== 时间戳 (统一使用 number epoch ms) =====
  createdAt: Date;
  updatedAt: Date;

  // ===== 业务方法 =====

  // 全局管理

  // 渠道管理

  // 分类管理
  updateCategoryPreference(
    category: NotificationCategory,
    preference: Partial<CategoryPreferenceServerDTO>,
  ): void;

  // 免打扰

  // 频率限制

  // 查询

  // ===== 转换方法 (To) =====
  /**
   * 转换为 Persistence DTO (数据库)
   */}
