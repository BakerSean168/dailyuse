/**
 * Notification Module - Infrastructure Server
 *
 * Ports and Adapters for Notification module persistence.
 */

// DI Module
export { NotificationModule } from './notification.module';
export { NotificationPowerSyncModule } from './powersync';
export { NotificationContainer } from './di/notification-container';

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

// PowerSync Adapters
export {
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
} from './adapters/powersync';
