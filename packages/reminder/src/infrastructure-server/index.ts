/**
 * Reminder Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Reminder module.
 */

// DI Module
export { ReminderModule } from './reminder.module';

// Prisma Adapters
export { ReminderGroupPrismaRepository } from './adapters/prisma/reminder-group-prisma.repository';
export { ReminderTemplatePrismaRepository } from './adapters/prisma/reminder-template-prisma.repository';
export { ReminderResponsePrismaRepository } from './adapters/prisma/reminder-response-prisma.repository';
export { UserReminderPreferencePrismaRepository } from './adapters/prisma/user-reminder-preference-prisma.repository';

// SQLite Adapters
export { SqliteReminderGroupRepository } from './adapters/sqlite/reminder-group-sqlite.repository';
export { SqliteReminderResponseRepository } from './adapters/sqlite/reminder-response-sqlite.repository';
export { SqliteReminderTemplateRepository } from './adapters/sqlite/reminder-template-sqlite.repository';

// SQLite schema
export { REMINDER_MODULE_SCHEMA } from './adapters/sqlite/schema';

