/**
 * ReminderGroup 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { ReminderGroup } from '../aggregates/reminder-group';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';

/**
 * IReminderGroupRepository 仓储接口
 *
 * 职责：
 * - 定义 ReminderGroup 聚合根的持久化操作契约
 * - 聚合根是操作的基本单位
 */
export interface IReminderGroupRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 如果 UUID 已存在则更新，否则插入
   */
  save(group: ReminderGroup): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid 提醒分组 UUID
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string): Promise<ReminderGroup | null>;

  /**
   * 通过账户 UUID 查找所有提醒分组
   *
   * @param accountUuid 账户 UUID
   * @param options.includeDeleted 是否包含已删除的分组（默认 false）
   * @returns 提醒分组列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]>;

  /**
   * 通过控制模式查找提醒分组
   *
   * @param accountUuid 账户 UUID
   * @param controlMode 控制模式
   * @param options.includeDeleted 是否包含已删除的分组
   * @returns 提醒分组列表
   */
  findByControlMode(
    accountUuid: string,
    controlMode: ControlMode,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]>;

  /**
   * 查找所有活跃的提醒分组
   *
   * @param accountUuid 账户 UUID（可选，不传则查找所有账户）
   * @returns 活跃的提醒分组列表
   */
  findActive(accountUuid?: string): Promise<ReminderGroup[]>;

  /**
   * 批量查找提醒分组
   *
   * @param uuids UUID 列表
   * @returns 提醒分组列表（顺序与传入的 UUID 列表一致）
   */
  findByIds(uuids: string[]): Promise<ReminderGroup[]>;

  /**
   * 通过名称查找分组
   * （用于防重复检查）
   *
   * @param accountUuid 账户 UUID
   * @param name 分组名称
   * @param excludeUuid 排除的 UUID（用于更新时检查）
   * @returns 分组实例，不存在则返回 null
   */
  findByName(
    accountUuid: string,
    name: string,
    excludeUuid?: string,
  ): Promise<ReminderGroup | null>;

  /**
   * 删除聚合根
   *
   * 注意：
   * - 这是事务操作
   * - 需要先处理分组下的模板（移除分组关联或一起删除）
   *
   * @param uuid 提醒分组 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查提醒分组是否存在
   *
   * @param uuid 提醒分组 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 统计账户下的提醒分组数量
   *
   * @param accountUuid 账户 UUID
   * @param options.status 按状态筛选
   * @param options.includeDeleted 是否包含已删除的分组
   * @returns 提醒分组数量
   */
  count(
    accountUuid: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number>;
}
