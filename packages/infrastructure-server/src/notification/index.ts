/**
 * Notification Module - Infrastructure Server
 *
 * Ports and Adapters for Notification module persistence.
 */

// DI Module
export { NotificationModule } from './notification.module';

// DI Factory
export { NotificationRepositoryFactory } from './di';

// Ports (Interfaces)
export { type INotificationRepository } from './ports/notification-repository.port';
export { type INotificationPreferenceRepository } from './ports/notification-preference-repository.port';
export { type INotificationTemplateRepository } from './ports/notification-template-repository.port';

// Prisma Adapters
export {
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository,
} from './adapters/prisma';

// SQLite Adapters
export {
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
} from './adapters/sqlite';
