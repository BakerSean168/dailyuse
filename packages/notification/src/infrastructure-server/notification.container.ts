/**
 * Notification Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞?Notification 妯″潡鐨?repository 瀹炰緥
 */

import type {
  INotificationRepository,
  INotificationPreferenceRepository,
  INotificationTemplateRepository,
} from '../domain-server/repositories';

/**
 * Notification 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class NotificationContainer {
  private static instance: NotificationContainer;
  private notificationRepository: INotificationRepository | null = null;
  private preferenceRepository: INotificationPreferenceRepository | null = null;
  private templateRepository: INotificationTemplateRepository | null = null;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
   */
  static resetInstance(): void {
    NotificationContainer.instance = new NotificationContainer();
  }

  /**
   * 娉ㄥ唽 NotificationRepository
   */
  registerNotificationRepository(repository: INotificationRepository): this {
    this.notificationRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 NotificationPreferenceRepository
   */
  registerPreferenceRepository(repository: INotificationPreferenceRepository): this {
    this.preferenceRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 NotificationTemplateRepository
   */
  registerTemplateRepository(repository: INotificationTemplateRepository): this {
    this.templateRepository = repository;
    return this;
  }

  /**
   * Get NotificationRepository
   */
  getNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      throw new Error('NotificationRepository not registered.');
    }
    return this.notificationRepository;
  }

  /**
   * Get NotificationPreferenceRepository
   */
  getPreferenceRepository(): INotificationPreferenceRepository {
    if (!this.preferenceRepository) {
      throw new Error('NotificationPreferenceRepository not registered.');
    }
    return this.preferenceRepository;
  }

  /**
   * Get NotificationTemplateRepository
   */
  getTemplateRepository(): INotificationTemplateRepository {
    if (!this.templateRepository) {
      throw new Error('NotificationTemplateRepository not registered.');
    }
    return this.templateRepository;
  }

  /**
   * 妫€鏌ユ槸鍚﹀凡閰嶇疆
   */
  isConfigured(): boolean {
    return (
      this.notificationRepository !== null &&
      this.preferenceRepository !== null &&
      this.templateRepository !== null
    );
  }

  /**
   * 娓呯┖All鏈夋敞鍐岀殑渚濊禆
   */
  clear(): void {
    this.notificationRepository = null;
    this.preferenceRepository = null;
    this.templateRepository = null;
  }
}
