/**
 * ReminderTemplate 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { ReminderTemplate } from '../aggregates/reminder-template';
import { ReminderStatus } from '@dailyuse/contracts/reminder';

/**
 * IReminderTemplateRepository 仓储接口
 *
 * 职责：
 * - 定义 ReminderTemplate 聚合根的持久化操作契约
 * - 聚合根是操作的基本单位
 * - 级联保存/加载子实体（ReminderHistory）
 */
export interface IReminderTemplateRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 级联保存所有子实体（ReminderHistory）
   * - 如果 UUID 已存在则更新，否则插入
   */
  save(template: ReminderTemplate): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid 提醒模板 UUID
   * @param options.includeHistory 是否加载历史记录（默认 false，懒加载）
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string, options?: { includeHistory?: boolean }): Promise<ReminderTemplate | null>;

  /**
   * 通过账户 UUID 查找所有提醒模板
   *
   * @param accountUuid 账户 UUID
   * @param options.includeHistory 是否加载历史记录
   * @param options.includeDeleted 是否包含已删除的模板（默认 false）
   * @returns 提醒模板列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]>;

  /**
   * 通过分组 UUID 查找所有提醒模板
   *
   * @param groupUuid 分组 UUID
   * @param options.includeHistory 是否加载历史记录
   * @param options.includeDeleted 是否包含已删除的模板（默认 false）
   * @returns 提醒模板列表
   */
  findByGroupUuid(
    groupUuid: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]>;

  /**
   * 查找所有活跃的提醒模板
   *
   * @param accountUuid 账户 UUID（可选，不传则查找所有账户）
   * @returns 活跃的提醒模板列表
   */
  findActive(accountUuid?: string): Promise<ReminderTemplate[]>;

  /**
   * 查找下次触发时间在指定时间之前的提醒模板
   * （用于触发器调度）
   *
   * @param beforeTime 时间戳（毫秒）
   * @param accountUuid 账户 UUID（可选）
   * @returns 待触发的提醒模板列表
   */
  findByNextTriggerBefore(beforeTime: number, accountUuid?: string): Promise<ReminderTemplate[]>;

  /**
   * 批量查找提醒模板
   *
   * @param uuids UUID 列表
   * @param options.includeHistory 是否加载历史记录
   * @returns 提醒模板列表（顺序与传入的 UUID 列表一致）
   */
  findByIds(uuids: string[], options?: { includeHistory?: boolean }): Promise<ReminderTemplate[]>;

  /**
   * 删除聚合根
   *
   * 注意：
   * - 这是事务操作
   * - 级联删除所有子实体（ReminderHistory）
   *
   * @param uuid 提醒模板 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查提醒模板是否存在
   *
   * @param uuid 提醒模板 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 统计账户下的提醒模板数量
   *
   * @param accountUuid 账户 UUID
   * @param options.status 按状态筛选
   * @param options.includeDeleted 是否包含已删除的模板
   * @returns 提醒模板数量
   */
  count(
    accountUuid: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number>;
}
