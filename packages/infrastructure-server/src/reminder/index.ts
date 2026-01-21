/**
 * Reminder Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Reminder module.
 */

// Module
export { ReminderModule } from './reminder.module';

// Repositories
export {
  PrismaReminderTemplateRepository,
  PrismaReminderGroupRepository,
  PrismaReminderStatisticsRepository,
} from './repositories';

// Container (Legacy support during transition if needed, otherwise removed)
// export { ReminderContainer } from './reminder.container';
