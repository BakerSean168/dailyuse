/**
 * Reminder Application Module (Client)
 *
 * Re-exports all reminder-related application services.
 */

// Smart Container
export { ReminderApplicationService, reminderApplicationService } from './reminder-application.service';

export { ReminderContainer } from '../infrastructure-client/reminder.container';

export {
  // Events
  ReminderTemplateEvents,
  ReminderGroupEvents,
  type ReminderTemplateRefreshEvent,
  type ReminderGroupRefreshEvent,
  
  // Reminder Template Use Cases
  CreateReminderTemplate,
  GetReminderTemplate,
  ListReminderTemplates,
  GetUserTemplates,
  UpdateReminderTemplate,
  DeleteReminderTemplate,
  ToggleTemplateEnabled,
  MoveTemplateToGroup,
  SearchTemplates,
  GetTemplateScheduleStatus,
  GetUpcomingReminders,
  
  // Reminder Group Use Cases
  CreateReminderGroup,
  GetReminderGroup,
  ListReminderGroups,
  GetUserReminderGroups,
  UpdateReminderGroup,
  DeleteReminderGroup,
  ToggleReminderGroupStatus,
  ToggleReminderGroupControlMode,
  
  // Legacy exports (deprecated)
  ReminderTemplateApplicationService,
  createReminderTemplateApplicationService,
  ReminderGroupApplicationService,
  createReminderGroupApplicationService,
} from './services';
