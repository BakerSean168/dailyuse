/**
 * Reminder Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Reminder module.
 */

// DI Module
export { ReminderModule } from './reminder.module';
export { ReminderContainer } from './di/reminder-container';

// Prisma Adapters
export { ReminderGroupPrismaRepository } from './adapters/prisma/reminder-group-prisma.repository';
export { ReminderTemplatePrismaRepository } from './adapters/prisma/reminder-template-prisma.repository';
export { ReminderResponsePrismaRepository } from './adapters/prisma/reminder-response-prisma.repository';
export { UserReminderPreferencePrismaRepository } from './adapters/prisma/user-reminder-preference-prisma.repository';

// PowerSync Adapters
export { ReminderGroupPowerSyncRepository } from './adapters/powersync/reminder-group-powersync.repository';
export { ReminderTemplatePowerSyncRepository } from './adapters/powersync/reminder-template-powersync.repository';
export { ReminderResponsePowerSyncRepository } from './adapters/powersync/reminder-response-powersync.repository';
export { UserReminderPreferencePowerSyncRepository } from './adapters/powersync/user-reminder-preference-powersync.repository';
