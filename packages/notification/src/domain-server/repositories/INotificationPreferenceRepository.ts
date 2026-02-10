/**
 * NotificationPreference 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 */

import type { NotificationPreference } from '../aggregates/notification-preference';

/**
 * INotificationPreferenceRepository 仓储接口
 *
 * 职责：
 * - 管理用户通知偏好的持久化
 * - 每个账户只有一个偏好设置
 */
export interface INotificationPreferenceRepository {
  /**
   * 保存偏好设置（创建或更新）
   */
  save(preference: NotificationPreference): Promise<void>;

  /**
   * 通过 UUID 查找偏好设置
   */
  findById(uuid: string): Promise<NotificationPreference | null>;

  /**
   * 通过账户 UUID 查找偏好设置
   *
   * @param accountUuid 账户 UUID
   * @returns 偏好设置，不存在则返回 null
   */
  findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null>;

  /**
   * 删除偏好设置
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查偏好设置是否存在
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 检查账户是否已有偏好设置
   *
   * @param accountUuid 账户 UUID
   */
  existsForAccount(accountUuid: string): Promise<boolean>;

  /**
   * 获取或创建偏好设置
   *
   * @param accountUuid 账户 UUID
   * @returns 偏好设置（如果不存在则创建默认设置）
   */
  getOrCreate(accountUuid: string): Promise<NotificationPreference>;
}
