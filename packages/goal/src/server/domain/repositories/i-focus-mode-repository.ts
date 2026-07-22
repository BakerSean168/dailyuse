/**
 * FocusMode 仓储接口
 * 专注模式仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现（Prisma / SQLite）
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { FocusMode } from '../value-objects';

/**
 * IFocusModeRepository 仓储接口
 *
 * 职责：
 * - FocusMode 值对象的持久化操作
 * - 提供按用户查询活跃模式
 * - 支持批量失效过期模式
 */
export interface IFocusModeRepository {
  /**
   * 保存专注模式（创建或更新）
   *
   * @param focusMode - FocusMode 值对象
   */
  save(focusMode: FocusMode): Promise<void>;

  /**
   * 通过 ID + identity 查找专注模式（唯一读路径）
   */
  findByIdForIdentity(identityId: string, id: string): Promise<FocusMode | null>;

  /**
   * 查找用户当前活跃的专注模式
   *
   * @param identityId - 用户身份 ID
   * @returns 活跃的专注模式，不存在则返回 null
   */
  findActiveByIdentityId(identityId: string): Promise<FocusMode | null>;

  /**
   * 查找用户的所有专注模式（包括历史）
   *
   * @param identityId - 用户身份 ID
   * @returns 专注模式列表（按创建时间倒序）
   */
  findByIdentityId(identityId: string): Promise<FocusMode[]>;

  /**
   * 批量失效过期的专注模式
   *
   * 注意：
   * - 查找所有 isActive=true 且 endTime < currentTime 的模式
   * - 批量设置 isActive=false 和 actualEndTime=endTime
   * - 由 Cron Job 定时调用
   *
   * @returns 失效的模式数量
   */
  deactivateExpired(): Promise<number>;

  /**
   * 删除专注模式（必须同时匹配 identity）
   *
   * @param identityId - 用户身份 ID
   * @param id - 专注模式 ID
   */
  delete(identityId: string, id: string): Promise<void>;
}
