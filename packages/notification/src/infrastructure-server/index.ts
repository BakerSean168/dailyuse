/**
 * Notification Module - Infrastructure Server
 *
 * Ports and Adapters for Notification module persistence.
 */

// DI Module
export { NotificationModule } from './notification.module';

// DI Factory
export { NotificationRepositoryFactory } from './di';

// Ports - Repository interfaces are exported from domain-server layer
// Use @dailyuse/notification/domain-server for INotificationRepository etc.

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

// SQLite schema
export { NOTIFICATION_MODULE_SCHEMA } from './adapters/sqlite/schema';
