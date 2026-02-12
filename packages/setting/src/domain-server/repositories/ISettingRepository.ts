/**
 * Setting Repository Interface
 * 设置仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { Setting } from '../aggregates/setting';
import { SettingScope } from '@dailyuse/contracts/setting';

export interface SettingQueryOptions {
  category?: string;
  isDefault?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ISettingRepository 仓储接口
 *
 * 职责：
 * - 定义 Setting 聚合根的持久化操作
 * - 聚合根是操作的基本单位
 * - 级联保存/加载子实体（如 history）
 */
export interface ISettingRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 级联保存历史记录
   * - 如果 UUID 已存在则更新，否则插入
   */
  save(setting: Setting): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid 设置 UUID
   * @param options.includeHistory 是否加载历史记录（默认 false，懒加载）
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string, options?: { includeHistory?: boolean }): Promise<Setting | null>;

  /**
   * 通过 key 查找设置
   *
   * @param key 设置键
   * @param scope 作用域
   * @param contextUuid 上下文 UUID（accountUuid 或 deviceId）
   * @returns 聚合根实例，不存在则返回 null
   */
  findByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<Setting | null>;

  /**
   * 按作用域查找所有设置
   *
   * @param scope 作用域
   * @param contextUuid 上下文 UUID（accountUuid 或 deviceId）
   * @param options.includeHistory 是否加载历史记录
   * @returns 设置列表
   */
  findByScope(
    scope: SettingScope,
    contextUuid?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]>;

  /**
   * 按分组查找设置
   *
   * @param groupUuid 分组 UUID
   * @param options.includeHistory 是否加载历史记录
   * @returns 设置列表
   */
  findByGroup(groupUuid: string, options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 查找所有系统设置
   *
   * @param options.includeHistory 是否加载历史记录
   * @returns 系统设置列表
   */
  findSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 查找用户设置
   *
   * @param accountUuid 账户 UUID
   * @param options.includeHistory 是否加载历史记录
   * @returns 用户设置列表
   */
  findUserSettings(accountUuid: string, options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 查找设备设置
   *
   * @param deviceId 设备 ID
   * @param options.includeHistory 是否加载历史记录
   * @returns 设备设置列表
   */
  findDeviceSettings(deviceId: string, options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 删除聚合根（软删除）
   *
   * 注意：
   * - 这是软删除操作
   * - 设置 deletedAt 时间戳
   *
   * @param uuid 设置 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查设置是否存在
   *
   * @param uuid 设置 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 检查 key 是否已被使用
   *
   * @param key 设置键
   * @param scope 作用域
   * @param contextUuid 上下文 UUID
   */
  existsByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<boolean>;

  /**
   * 批量保存设置
   *
   * @param settings 设置列表
   */
  saveMany(settings: Setting[]): Promise<void>;

  /**
   * 搜索设置
   *
   * @param query 搜索查询
   * @param scope 可选的作用域过滤
   * @returns 匹配的设置列表
   */
  search(query: string, scope?: SettingScope): Promise<Setting[]>;
}
