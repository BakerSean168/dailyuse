/**
 * Notification Container (Server)
 *
 * 依赖注入容器，管�?Notification 模块�?repository 实例
 */

import type {
  INotificationRepository,
  INotificationPreferenceRepository,
  INotificationTemplateRepository,
} from '@dailyuse/domain-server/notification';

/**
 * Notification 模块依赖注入容器
 */
export class NotificationContainer {
  private static instance: NotificationContainer;
  private notificationRepository: INotificationRepository | null = null;
  private preferenceRepository: INotificationPreferenceRepository | null = null;
  private templateRepository: INotificationTemplateRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    NotificationContainer.instance = new NotificationContainer();
  }

  /**
   * 注册 NotificationRepository
   */
  registerNotificationRepository(repository: INotificationRepository): this {
    this.notificationRepository = repository;
    return this;
  }

  /**
   * 注册 NotificationPreferenceRepository
   */
  registerPreferenceRepository(repository: INotificationPreferenceRepository): this {
    this.preferenceRepository = repository;
    return this;
  }

  /**
   * 注册 NotificationTemplateRepository
   */
  registerTemplateRepository(repository: INotificationTemplateRepository): this {
    this.templateRepository = repository;
    return this;
  }

  /**
   * 获取 NotificationRepository
   */
  getNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      throw new Error('NotificationRepository not registered.');
    }
    return this.notificationRepository;
  }

  /**
   * 获取 NotificationPreferenceRepository
   */
  getPreferenceRepository(): INotificationPreferenceRepository {
    if (!this.preferenceRepository) {
      throw new Error('NotificationPreferenceRepository not registered.');
    }
    return this.preferenceRepository;
  }

  /**
   * 获取 NotificationTemplateRepository
   */
  getTemplateRepository(): INotificationTemplateRepository {
    if (!this.templateRepository) {
      throw new Error('NotificationTemplateRepository not registered.');
    }
    return this.templateRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return (
      this.notificationRepository !== null &&
      this.preferenceRepository !== null &&
      this.templateRepository !== null
    );
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.notificationRepository = null;
    this.preferenceRepository = null;
    this.templateRepository = null;
  }
}
