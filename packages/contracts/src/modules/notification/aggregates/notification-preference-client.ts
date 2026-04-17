/**
 * NotificationPreference Aggregate Root - Client Interface
 * 通知偏好聚合根 - 客户端接口
 */

import type { NotificationPreferenceId } from '../../../primitives';
import type { NotificationChannelType } from '../value-objects/notification-channel-type';
import type { IdentityId } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * NotificationPreference Client DTO
 */
export interface NotificationPreferenceClientDTO {
  id: string;
  identityId: string;
  settings: Record<string, NotificationChannelType[]>; // 模块名 => 渠道列表
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}
