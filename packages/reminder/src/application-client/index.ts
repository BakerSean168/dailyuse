/**
 * Reminder Application Module (Client)
 *
 * Re-exports all reminder-related application services.
 */

// Smart Container
export { ReminderApplicationService, reminderApplicationService } from './reminder-application.service';

export { ReminderContainer } from '@/infrastructure-client';

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
  
  // Reminder Statistics Use Cases
  GetReminderStatistics,
  
  // Legacy exports (deprecated)
  ReminderTemplateApplicationService,
  createReminderTemplateApplicationService,
  ReminderGroupApplicationService,
  createReminderGroupApplicationService,
  ReminderStatisticsApplicationService,
  createReminderStatisticsApplicationService,
} from './services';
