/**
 * Notification Module - Infrastructure Server
 *
 * Ports and Adapters for Notification module persistence.
 */

// Container
export { NotificationContainer } from './notification.container';
export { NotificationModule } from './notification.module';

// Ports (Interfaces)
export { type INotificationRepository } from './ports/notification-repository.port';
export { type INotificationPreferenceRepository } from './ports/notification-preference-repository.port';
export { type INotificationTemplateRepository } from './ports/notification-template-repository.port';

// Prisma Adapters
export { NotificationPrismaRepository } from './adapters/prisma/notification-prisma.repository';
export { NotificationPreferencePrismaRepository } from './adapters/prisma/notification-preference-prisma.repository';
export { NotificationTemplatePrismaRepository } from './adapters/prisma/notification-template-prisma.repository';

// Memory Adapters
export { NotificationMemoryRepository } from './adapters/memory/notification-memory.repository';
export { NotificationPreferenceMemoryRepository } from './adapters/memory/notification-preference-memory.repository';
export { NotificationTemplateMemoryRepository } from './adapters/memory/notification-template-memory.repository';
