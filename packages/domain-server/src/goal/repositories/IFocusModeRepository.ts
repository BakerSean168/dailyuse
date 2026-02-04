/**
 * FocusMode Repository Interface
 * 专注周期模式仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { FocusMode } from '../value-objects';

/**
 * IFocusModeRepository 仓储接口
 *
 * 职责：
 * - FocusMode 值对象的持久化操作
 * - 提供按账户查询活跃周期
 * - 支持批量失效过期周期
 */
export interface IFocusModeRepository {
  /**
   * 保存专注周期（创建或更新）
   *
   * @param focusMode - FocusMode 值对象
   */
  save(focusMode: FocusMode): Promise<void>;

  /**
   * 通过 UUID 查找专注周期
   *
   * @param uuid - 专注周期 UUID
   * @returns 专注周期实例，不存在则返回 null
   */
  findById(uuid: string): Promise<FocusMode | null>;

  /**
   * 查找账户当前活跃的专注周期
   *
   * @param accountUuid - 账户 UUID
   * @returns 活跃的专注周期，不存在则返回 null
   */
  findActiveByAccountUuid(accountUuid: string): Promise<FocusMode | null>;

  /**
   * 查找账户的所有专注周期（包括历史）
   *
   * @param accountUuid - 账户 UUID
   * @returns 专注周期列表（按创建时间倒序）
   */
  findByAccountUuid(accountUuid: string): Promise<FocusMode[]>;

  /**
   * 批量失效过期的专注周期
   *
   * 注意：
   * - 查找所有 isActive=true 且 endTime < currentTime 的周期
   * - 批量设置 isActive=false 和 actualEndTime=endTime
   * - 由 Cron Job 定时调用
   *
   * @returns 失效的周期数量
   */
  deactivateExpired(): Promise<number>;

  /**
   * 删除专注周期
   *
   * @param uuid - 专注周期 UUID
   */
  delete(uuid: string): Promise<void>;
}
