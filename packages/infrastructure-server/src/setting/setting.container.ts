/**
 * Setting Container (Server)
 *
 * 依赖注入容器，管�?Setting 模块�?repository 实例
 */

import type {
  IAppConfigRepository,
  ISettingRepository,
  IUserSettingRepository,
} from '@dailyuse/domain-server/setting';

/**
 * Setting 模块依赖注入容器
 */
export class SettingContainer {
  private static instance: SettingContainer;
  private appConfigRepository: IAppConfigRepository | null = null;
  private settingRepository: ISettingRepository | null = null;
  private userSettingRepository: IUserSettingRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    SettingContainer.instance = new SettingContainer();
  }

  /**
   * 注册 AppConfigRepository
   */
  registerAppConfigRepository(repository: IAppConfigRepository): this {
    this.appConfigRepository = repository;
    return this;
  }

  /**
   * 注册 SettingRepository
   */
  registerSettingRepository(repository: ISettingRepository): this {
    this.settingRepository = repository;
    return this;
  }

  /**
   * 注册 UserSettingRepository
   */
  registerUserSettingRepository(repository: IUserSettingRepository): this {
    this.userSettingRepository = repository;
    return this;
  }

  /**
   * 获取 AppConfigRepository
   */
  getAppConfigRepository(): IAppConfigRepository {
    if (!this.appConfigRepository) {
      throw new Error('AppConfigRepository not registered.');
    }
    return this.appConfigRepository;
  }

  /**
   * 获取 SettingRepository
   */
  getSettingRepository(): ISettingRepository {
    if (!this.settingRepository) {
      throw new Error('SettingRepository not registered.');
    }
    return this.settingRepository;
  }

  /**
   * 获取 UserSettingRepository
   */
  getUserSettingRepository(): IUserSettingRepository {
    if (!this.userSettingRepository) {
      throw new Error('UserSettingRepository not registered.');
    }
    return this.userSettingRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.userSettingRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.appConfigRepository = null;
    this.settingRepository = null;
    this.userSettingRepository = null;
  }
}
