// @ts-nocheck
import type {
  NotificationRepository as INotificationRepository,
  NotificationRepository as INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';
import { PrismaNotificationRepository } from '../repositories/PrismaNotificationRepository';
import { PrismaNotificationTemplateRepository } from '../repositories/PrismaNotificationTemplateRepository';
import { PrismaNotificationPreferenceRepository } from '../repositories/PrismaNotificationPreferenceRepository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Notification 依赖注入容器
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
      this.notificationRepository = new PrismaNotificationRepository(prisma);
    }
    return this.notificationRepository;
  }

  getNotificationTemplateRepository(): INotificationTemplateRepository {
    if (!this.templateRepository) {
      this.templateRepository = new PrismaNotificationTemplateRepository(prisma);
    }
    return this.templateRepository;
  }

  getNotificationPreferenceRepository(): INotificationPreferenceRepository {
    if (!this.preferenceRepository) {
      this.preferenceRepository = new PrismaNotificationPreferenceRepository(prisma);
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
