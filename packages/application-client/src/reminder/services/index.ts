/**
 * Reminder Application Services
 *
 * Named exports for all reminder-related application services.
 */

// Container
export { ReminderContainer } from '@dailyuse/infrastructure-client';

// Events
export {
  ReminderTemplateEvents,
  ReminderGroupEvents,
  type ReminderTemplateRefreshEvent,
  type ReminderGroupRefreshEvent,
} from './reminder-events';

// Reminder Template Use Cases
export { CreateReminderTemplate } from './create-reminder-template';
export { GetReminderTemplate } from './get-reminder-template';
export { ListReminderTemplates } from './list-reminder-templates';
export { GetUserTemplates } from './get-user-templates';
export { UpdateReminderTemplate } from './update-reminder-template';
export { DeleteReminderTemplate } from './delete-reminder-template';
export { ToggleTemplateEnabled } from './toggle-template-enabled';
export { MoveTemplateToGroup } from './move-template-to-group';
export { SearchTemplates } from './search-templates';
export { GetTemplateScheduleStatus } from './get-template-schedule-status';
export { GetUpcomingReminders } from './get-upcoming-reminders';

// Reminder Group Use Cases
export { CreateReminderGroup } from './create-reminder-group';
export { GetReminderGroup } from './get-reminder-group';
export { ListReminderGroups } from './list-reminder-groups';
export { GetUserReminderGroups } from './get-user-reminder-groups';
export { UpdateReminderGroup } from './update-reminder-group';
export { DeleteReminderGroup } from './delete-reminder-group';
export { ToggleReminderGroupStatus } from './toggle-reminder-group-status';
export { ToggleReminderGroupControlMode } from './toggle-reminder-group-control-mode';

// Reminder Statistics Use Cases
export { GetReminderStatistics } from './get-reminder-statistics';

// Legacy exports for backward compatibility (deprecated)
export {
  ReminderTemplateApplicationService,
  createReminderTemplateApplicationService,
} from './ReminderTemplateApplicationService';

export {
  ReminderGroupApplicationService,
  createReminderGroupApplicationService,
} from './ReminderGroupApplicationService';

export {
  ReminderStatisticsApplicationService,
  createReminderStatisticsApplicationService,
} from './ReminderStatisticsApplicationService';
