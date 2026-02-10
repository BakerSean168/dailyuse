/**
 * Setting Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞?Setting 妯″潡鐨?repository 瀹炰緥
 */

import type {
  IAppConfigRepository,
  ISettingRepository,
  IUserSettingRepository,
} from '@/domain-server';

/**
 * Setting 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class SettingContainer {
  private static instance: SettingContainer;
  private appConfigRepository: IAppConfigRepository | null = null;
  private settingRepository: ISettingRepository | null = null;
  private userSettingRepository: IUserSettingRepository | null = null;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
   */
  static resetInstance(): void {
    SettingContainer.instance = new SettingContainer();
  }

  /**
   * 娉ㄥ唽 AppConfigRepository
   */
  registerAppConfigRepository(repository: IAppConfigRepository): this {
    this.appConfigRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 SettingRepository
   */
  registerSettingRepository(repository: ISettingRepository): this {
    this.settingRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 UserSettingRepository
   */
  registerUserSettingRepository(repository: IUserSettingRepository): this {
    this.userSettingRepository = repository;
    return this;
  }

  /**
   * Get AppConfigRepository
   */
  getAppConfigRepository(): IAppConfigRepository {
    if (!this.appConfigRepository) {
      throw new Error('AppConfigRepository not registered.');
    }
    return this.appConfigRepository;
  }

  /**
   * Get SettingRepository
   */
  getSettingRepository(): ISettingRepository {
    if (!this.settingRepository) {
      throw new Error('SettingRepository not registered.');
    }
    return this.settingRepository;
  }

  /**
   * Get UserSettingRepository
   */
  getUserSettingRepository(): IUserSettingRepository {
    if (!this.userSettingRepository) {
      throw new Error('UserSettingRepository not registered.');
    }
    return this.userSettingRepository;
  }

  /**
   * 妫€鏌ユ槸鍚﹀凡閰嶇疆
   */
  isConfigured(): boolean {
    return this.userSettingRepository !== null;
  }

  /**
   * 娓呯┖All鏈夋敞鍐岀殑渚濊禆
   */
  clear(): void {
    this.appConfigRepository = null;
    this.settingRepository = null;
    this.userSettingRepository = null;
  }
}
