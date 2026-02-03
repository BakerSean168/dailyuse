import type {
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  QueryReminderTemplatesRequest,
  ReminderTemplateDTO,
  ReminderTemplateListDTO,
  GetUpcomingRemindersRequestSchema,
  ReminderOperationResponseDTO,
  TemplateScheduleStatusDTO,
  UpcomingReminderItemDTO,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
  SwitchGroupControlModeRequest,
  BatchGroupTemplatesRequest,
  ReminderGroupClientDTO,
} from '../api';

// === Reminder Module RPC Map ===
export type ReminderRpcMap = {
  // === Template Operations ===
  'reminder:create-template': [CreateReminderTemplateRequest, ReminderTemplateDTO];
  'reminder:update-template': [UpdateReminderTemplateRequest, ReminderTemplateDTO];
  'reminder:query-templates': [QueryReminderTemplatesRequest, ReminderTemplateListDTO];
  'reminder:get-upcoming': [{ days?: number; limit?: number; importanceLevel?: string; type?: string }, UpcomingReminderItemDTO[]];
  
  // === Template Control ===
  'reminder:enable-template': [{ templateUuid: string }, ReminderOperationResponseDTO];
  'reminder:pause-template': [{ templateUuid: string }, ReminderOperationResponseDTO];
  'reminder:disable-template': [{ templateUuid: string }, ReminderOperationResponseDTO];
  'reminder:delete-template': [{ templateUuid: string }, ReminderOperationResponseDTO];
  'reminder:get-schedule-status': [{ templateUuid: string }, TemplateScheduleStatusDTO];
  
  // === Batch Operations ===
  'reminder:batch-enable': [{ templateUuids: string[] }, ReminderOperationResponseDTO];
  'reminder:batch-pause': [{ templateUuids: string[] }, ReminderOperationResponseDTO];
  
  // === Group Operations ===
  'reminder-group:create': [CreateReminderGroupRequest, ReminderGroupClientDTO];
  'reminder-group:update': [UpdateReminderGroupRequest, ReminderGroupClientDTO];
  'reminder-group:switch-mode': [SwitchGroupControlModeRequest, ReminderGroupClientDTO];
  'reminder-group:batch-templates': [BatchGroupTemplatesRequest, ReminderOperationResponseDTO];
  'reminder-group:list': [{ status?: string }, ReminderGroupClientDTO[]];
};
