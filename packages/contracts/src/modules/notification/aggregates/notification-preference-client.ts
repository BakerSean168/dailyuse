/**
 * NotificationPreference Aggregate Root - Client Interface
 * 通知偏好聚合根 - 客户端接口
 */

import type { NotificationCategory } from '../value-objects';
import type {
  NotificationPreferenceServerDTO,
  CategoryPreferences,
  ChannelPreferences,
} from './notification-preference-server';
import type {
  CategoryPreferenceClient,
  CategoryPreferenceClientDTO,
  DoNotDisturbConfigClientDTO,
  RateLimitClient,
  RateLimitClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * NotificationPreference Client DTO
 */
export interface NotificationPreferenceClientDTO {
  uuid: string;
  accountUuid: string;
  enabled: boolean;
  channels: ChannelPreferences;
  categories: {
    task: CategoryPreferenceClientDTO;
    goal: CategoryPreferenceClientDTO;
    schedule: CategoryPreferenceClientDTO;
    reminder: CategoryPreferenceClientDTO;
    account: CategoryPreferenceClientDTO;
    system: CategoryPreferenceClientDTO;
  };
  doNotDisturb?: DoNotDisturbConfigClientDTO | null;
  rateLimit?: RateLimitClientDTO | null;
  createdAt: number;
  updatedAt: number;

  // UI 计算属性
  isAllEnabled: boolean;
  isAllDisabled: boolean;
  hasDoNotDisturb: boolean;
  isInDoNotDisturbPeriod: boolean;
  enabledChannelsCount: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

// ============ 实体接口 ============

/**
 * NotificationPreference 聚合根 - Client 接口（实例方法）
 */
export interface NotificationPreferenceClient {
  // ===== 基础属性 =====
  uuid: string;
  accountUuid: string;
  enabled: boolean;

  // ===== 渠道开关 =====
  channels: ChannelPreferences;

  // ===== 分类偏好 =====
  categories: {
    task: CategoryPreferenceClient;
    goal: CategoryPreferenceClient;
    schedule: CategoryPreferenceClient;
    reminder: CategoryPreferenceClient;
    account: CategoryPreferenceClient;
    system: CategoryPreferenceClient;
  };

  // ===== 免打扰设置（值对象） =====
  doNotDisturb?: DoNotDisturbConfigClientDTO | null;

  // ===== 频率限制（值对象） =====
  rateLimit?: RateLimitClient | null;

  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;

  // ===== UI 计算属性 =====
  isAllEnabled: boolean;
  isAllDisabled: boolean;
  hasDoNotDisturb: boolean;
  isInDoNotDisturbPeriod: boolean;
  enabledChannelsCount: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;

  // ===== UI 业务方法 =====

  // 格式化展示

  // 操作判断

}
