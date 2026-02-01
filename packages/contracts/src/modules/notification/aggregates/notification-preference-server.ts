/**
 * NotificationPreference Aggregate Root - Server Interface
 * 通知偏好聚合根 - 服务端接口
 */

import type {
  NotificationChannelType,
} from '../value-objects';

import type { IdentityId } from '@/primitives';

// ============ 实体接口 ============

/**
 * 管理用户的通知配置
 * 例如：Task 模块的消息，我希望 [桌面弹窗 + 邮件]
 * System 模块的消息，我只需要 [桌面弹窗]
 */
export interface NotificationPreferenceServer {
  // ===== 基础属性 =====
  id: string;
  identityId: IdentityId;

  // Key: 模块名; Value: 开启的渠道列表
  settings: Map<string, NotificationChannelType[]>;
}

// ============ DTO 定义 ============

/**
 * NotificationPreference Server DTO
 */
export interface NotificationPreferenceServerDTO {
  id: string;
  identityId: string;
  settings: Record<string, NotificationChannelType[]>; // 模块名 => 渠道列表
}

/**
 * NotificationPreference Persistence DTO (数据库映射)
 */
export interface NotificationPreferencePersistenceDTO {
  id: string;
  identityId: string;
  settings: string; // JSON string - Record<string, NotificationChannelType[]>
}

