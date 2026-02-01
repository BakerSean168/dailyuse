/**
 * NotificationPreference Aggregate Root - Client Interface
 * 通知偏好聚合根 - 客户端接口
 */

import type { NotificationPreferenceId } from '@/primitives';
import type { NotificationChannelType } from '../value-objects';
import type { IdentityId } from '@/primitives';

// ============ 实体接口 ============

/**
 * NotificationPreference 聚合根 - Client 接口
 */
export interface NotificationPreferenceClient {
  // ===== 基础属性 =====
  id: NotificationPreferenceId;
  identityId: IdentityId;

  // Key: 模块名; Value: 开启的渠道列表
  settings: Record<string, NotificationChannelType[]>;
}

// ============ DTO 定义 ============

/**
 * NotificationPreference Client DTO
 */
export interface NotificationPreferenceClientDTO {
  id: string;
  identityId: string;
  settings: Record<string, NotificationChannelType[]>; // 模块名 => 渠道列表
}

