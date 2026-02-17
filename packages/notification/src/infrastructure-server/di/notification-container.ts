import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '../../domain-server/repositories';

/**
 * Notification 渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class NotificationContainer {
  private static instance: NotificationContainer;
  private notificationRepository: INotificationRepository | null = null;
  private templateRepository: INotificationTemplateRepository | null = null;
  private preferenceRepository: INotificationPreferenceRepository | null = null;

  private constructor() {}

  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  getNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      throw new Error('NotificationRepository not registered in NotificationContainer');
    }
    return this.notificationRepository;
  }

  getNotificationTemplateRepository(): INotificationTemplateRepository {
    if (!this.templateRepository) {
      throw new Error('NotificationTemplateRepository not registered in NotificationContainer');
    }
    return this.templateRepository;
  }

  getNotificationPreferenceRepository(): INotificationPreferenceRepository {
    if (!this.preferenceRepository) {
      throw new Error('NotificationPreferenceRepository not registered in NotificationContainer');
    }
    return this.preferenceRepository;
  }

  // For testing purposes
  setNotificationRepository(repository: INotificationRepository): void {
    this.notificationRepository = repository;
  }

  setNotificationTemplateRepository(repository: INotificationTemplateRepository): void {
    this.templateRepository = repository;
  }

  setNotificationPreferenceRepository(repository: INotificationPreferenceRepository): void {
    this.preferenceRepository = repository;
  }

  reset(): void {
    this.notificationRepository = null;
    this.templateRepository = null;
    this.preferenceRepository = null;
  }
}

