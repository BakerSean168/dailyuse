/**
 * IUserReminderPreferenceRepository
 * 用户提醒偏好仓储接口
 *
 * DDD 仓储职责：
 * - UserReminderPreferences 聚合根的持久化
 * - 聚合根是操作的基本单位
 */

import type { UserReminderPreferences } from '../aggregates/user-reminder-preferences';

export interface IUserReminderPreferenceRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * @param preferences UserReminderPreferences 聚合根
   */
  save(preferences: UserReminderPreferences): Promise<void>;

  /**
   * 根据身份 ID 查找用户提醒偏好
   *
   * @param identityId 身份 ID
   * @returns 聚合根实例，不存在则返回 null
   */
  findByIdentityId(identityId: string): Promise<UserReminderPreferences | null>;

  /**
   * 删除用户提醒偏好
   *
   * @param identityId 身份 ID
   */
  delete(identityId: string): Promise<void>;

  /**
   * 检查是否存在
   *
   * @param identityId 身份 ID
   */
  exists(identityId: string): Promise<boolean>;
}
