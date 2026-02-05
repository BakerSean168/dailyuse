/**
 * NotificationTemplate 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 */

import type { NotificationTemplate } from '../aggregates/notification-template';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';

/**
 * INotificationTemplateRepository 仓储接口
 *
 * 职责：
 * - 管理通知模板的持久化
 * - 支持模板查询和筛选
 */
export interface INotificationTemplateRepository {
  /**
   * 保存模板（创建或更新）
   */
  save(template: NotificationTemplate): Promise<void>;

  /**
   * 通过 UUID 查找模板
   */
  findById(uuid: string): Promise<NotificationTemplate | null>;

  /**
   * 查找所有模板
   *
   * @param options.includeInactive 是否包含未激活的模板（默认 false）
   */
  findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]>;

  /**
   * 通过名称查找模板
   */
  findByName(name: string): Promise<NotificationTemplate | null>;

  /**
   * 通过分类查找模板
   *
   * @param category 通知分类
   * @param options.activeOnly 只返回激活的模板（默认 true）
   */
  findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]>;

  /**
   * 通过类型查找模板
   *
   * @param type 通知类型
   * @param options.activeOnly 只返回激活的模板（默认 true）
   */
  findByType(
    type: NotificationType,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]>;

  /**
   * 查找系统预设模板
   */
  findSystemTemplates(): Promise<NotificationTemplate[]>;

  /**
   * 删除模板
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查模板是否存在
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 检查模板名称是否已被使用
   *
   * @param name 模板名称
   * @param excludeUuid 排除的 UUID（用于更新时检查）
   */
  isNameUsed(name: string, excludeUuid?: string): Promise<boolean>;

  /**
   * 统计模板数量
   */
  count(options?: { activeOnly?: boolean }): Promise<number>;
}
