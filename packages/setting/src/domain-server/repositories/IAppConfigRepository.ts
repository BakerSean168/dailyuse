/**
 * AppConfig Repository Interface
 * 应用配置仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现
 * - 由基础设施层实现
 */

// import type { AppConfigServer } from '../aggregates/AppConfigServer';

/**
 * IAppConfigRepository 仓储接口
 *
 * 职责：
 * - 定义 AppConfig 聚合根的持久化操作
 * - 应用配置通常是单例
 */
export interface IAppConfigRepository {
  /**
   * 保存应用配置（创建或更新）
   */
  save(config: any): Promise<void>;

  /**
   * 通过 UUID 查找应用配置
   *
   * @param uuid 配置 UUID
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string): Promise<any | null>;

  /**
   * 获取当前应用配置
   *
   * @returns 当前生效的配置
   */
  getCurrent(): Promise<any | null>;

  /**
   * 通过版本号查找配置
   *
   * @param version 版本号
   * @returns 聚合根实例，不存在则返回 null
   */
  findByVersion(version: string): Promise<any | null>;

  /**
   * 获取所有历史版本
   *
   * @returns 配置历史列表（按时间倒序）
   */
  findAllVersions(): Promise<any[]>;

  /**
   * 删除配置
   *
   * @param uuid 配置 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查配置是否存在
   *
   * @param uuid 配置 UUID
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 检查版本是否存在
   *
   * @param version 版本号
   */
  existsByVersion(version: string): Promise<boolean>;
}
