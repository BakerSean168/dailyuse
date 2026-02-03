import type {
  CreateReminderTemplateReq,
  CreateReminderTemplateRes,
  UpdateReminderTemplateReq,
  UpdateReminderTemplateRes,
  GetUpcomingRemindersReq,
  GetUpcomingRemindersRes,
  CreateReminderGroupReq,
  CreateReminderGroupRes,
  UpdateReminderGroupReq,
  UpdateReminderGroupRes,
  SwitchGroupControlModeReq,
  SwitchGroupControlModeRes,
} from '../api';

import type { ReminderTemplateClientDTO, ReminderGroupClientDTO } from '../aggregates';

// === Reminder Module RPC Map ===
export type ReminderRpcMap = {
  // === Template Operations ===
  'reminder:create-template': [CreateReminderTemplateReq, CreateReminderTemplateRes];
  'reminder:update-template': [UpdateReminderTemplateReq, UpdateReminderTemplateRes];
  'reminder:get-upcoming': [GetUpcomingRemindersReq, GetUpcomingRemindersRes];
  
  // === Template Control ===
  'reminder:enable-template': [{ templateUuid: string }, ReminderTemplateClientDTO];
  'reminder:pause-template': [{ templateUuid: string }, ReminderTemplateClientDTO];
  'reminder:disable-template': [{ templateUuid: string }, ReminderTemplateClientDTO];
  'reminder:delete-template': [{ templateUuid: string }, void];
  
  // === Group Operations ===
  'reminder-group:create': [CreateReminderGroupReq, CreateReminderGroupRes];
  'reminder-group:update': [UpdateReminderGroupReq, UpdateReminderGroupRes];
  'reminder-group:switch-mode': [SwitchGroupControlModeReq, SwitchGroupControlModeRes];
  'reminder-group:list': [void, ReminderGroupClientDTO[]];
};
