/**
 * Notification 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { Notification } from '../aggregates/notification';
import { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';

/**
 * INotificationRepository 仓储接口
 *
 * 职责：
 * - 定义持久化操作的契约
 * - 聚合根是操作的基本单位
 * - 级联保存/加载子实体（channels, history）
 */
export interface INotificationRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 级联保存所有子实体（channels, history）
   * - 如果 UUID 已存在则更新，否则插入
   */
  save(notification: Notification): Promise<void>;

  /**
   * 批量保存通知
   */
  saveMany(notifications: Notification[]): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid 通知 UUID
   * @param options.includeChildren 是否加载子实体（默认 false，懒加载）
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Notification | null>;

  /**
   * 通过账户 UUID 查找所有通知
   *
   * @param accountUuid 账户 UUID
   * @param options.includeChildren 是否加载子实体
   * @param options.includeRead 是否包含已读通知（默认 true）
   * @param options.includeDeleted 是否包含已删除通知（默认 false）
   * @param options.limit 限制数量
   * @param options.offset 偏移量
   * @returns 通知列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]>;

  /**
   * 通过状态查找通知
   *
   * @param accountUuid 账户 UUID
   * @param status 通知状态
   * @param options.limit 限制数量
   * @param options.offset 偏移量
   */
  findByStatus(
    accountUuid: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]>;

  /**
   * 通过分类查找通知
   *
   * @param accountUuid 账户 UUID
   * @param category 通知分类
   * @param options.limit 限制数量
   * @param options.offset 偏移量
   */
  findByCategory(
    accountUuid: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]>;

  /**
   * 查找未读通知
   *
   * @param accountUuid 账户 UUID
   * @param options.limit 限制数量
   */
  findUnread(accountUuid: string, options?: { limit?: number }): Promise<Notification[]>;

  /**
   * 查找相关实体的通知
   *
   * @param relatedEntityType 相关实体类型
   * @param relatedEntityUuid 相关实体 UUID
   */
  findByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string,
  ): Promise<Notification[]>;

  /**
   * 删除聚合根
   *
   * 注意：
   * - 这是事务操作
   * - 级联删除所有子实体
   *
   * @param uuid 通知 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除通知
   */
  deleteMany(uuids: string[]): Promise<void>;

  /**
   * 软删除通知（标记为已删除）
   */
  softDelete(uuid: string): Promise<void>;

  /**
   * 检查通知是否存在
   *
   * @param uuid 通知 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 统计未读通知数量
   *
   * @param accountUuid 账户 UUID
   */
  countUnread(accountUuid: string): Promise<number>;

  /**
   * 统计各分类通知数量
   *
   * @param accountUuid 账户 UUID
   */
  countByCategory(accountUuid: string): Promise<Record<NotificationCategory, number>>;

  /**
   * 批量标记为已读
   *
   * @param uuids 通知 UUID 列表
   */
  markManyAsRead(uuids: string[]): Promise<void>;

  /**
   * 标记所有为已读
   *
   * @param accountUuid 账户 UUID
   */
  markAllAsRead(accountUuid: string): Promise<void>;

  /**
   * 清理过期通知
   *
   * @param beforeTimestamp 在此时间之前的通知
   */
  cleanupExpired(beforeTimestamp: number): Promise<number>;

  /**
   * 清理已删除通知
   *
   * @param beforeTimestamp 在此时间之前删除的通知
   */
  cleanupDeleted(beforeTimestamp: number): Promise<number>;
}
