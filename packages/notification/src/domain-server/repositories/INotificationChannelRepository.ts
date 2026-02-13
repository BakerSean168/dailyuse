/**
 * INotificationChannelRepository
 * 通知渠道仓储接口
 *
 * DDD 仓储职责：
 * - 通知渠道的持久化
 * - 通知渠道的查询
 */

import type { NotificationChannelServerDTO } from '@dailyuse/contracts/notification';

export interface INotificationChannelRepository {
  /**
   * 保存通知渠道（创建或更新）
   */
  save(channel: NotificationChannelServerDTO): Promise<void>;

  /**
   * 根据 ID 查找通知渠道
   */
  findById(id: string): Promise<NotificationChannelServerDTO | null>;

  /**
   * 根据通知 ID 查找所有渠道
   */
  findByNotificationId(notificationId: string): Promise<NotificationChannelServerDTO[]>;

  /**
   * 删除通知渠道
   */
  delete(id: string): Promise<void>;

  /**
   * 检查渠道是否存在
   */
  exists(id: string): Promise<boolean>;
}
