/**
 * IUserReminderPreferenceRepository
 * 用户提醒偏好仓储接口
 *
 * DDD 仓储职责：
 * - 用户提醒偏好的持久化
 * - 用户提醒偏好的查询
 */

import type { UserReminderPreferencesServerDTO } from '@dailyuse/contracts/reminder';

export interface IUserReminderPreferenceRepository {
  /**
   * 保存用户提醒偏好（创建或更新）
   */
  upsert(preferences: UserReminderPreferencesServerDTO): Promise<UserReminderPreferencesServerDTO>;

  /**
   * 根据账户 UUID 查找用户提醒偏好
   */
  findByAccountUuid(accountUuid: string): Promise<UserReminderPreferencesServerDTO | null>;

  /**
   * 删除用户提醒偏好
   */
  delete(accountUuid: string): Promise<boolean>;

  /**
   * 检查是否存在
   */
  exists(accountUuid: string): Promise<boolean>;
}
