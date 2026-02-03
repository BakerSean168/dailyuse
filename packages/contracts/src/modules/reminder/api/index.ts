/**
 * Reminder Module - API Export
 * 
 * 【规范说明：API 层导出】
 * 按功能分组，每个操作导出相关的 Schema、Request、Response 类型
 */

export {
  // Reminder Template Operations
  CreateReminderTemplateSchema,
  type CreateReminderTemplateReq,
  type CreateReminderTemplateRes,
  UpdateReminderTemplateSchema,
  type UpdateReminderTemplateReq,
  type UpdateReminderTemplateRes,
  GetUpcomingRemindersSchema,
  type GetUpcomingRemindersReq,
  type GetUpcomingRemindersRes,

  // Reminder Group Operations
  CreateReminderGroupSchema,
  type CreateReminderGroupReq,
  type CreateReminderGroupRes,
  UpdateReminderGroupSchema,
  type UpdateReminderGroupReq,
  type UpdateReminderGroupRes,
  SwitchGroupControlModeSchema,
  type SwitchGroupControlModeReq,
  type SwitchGroupControlModeRes,
  BatchGroupTemplatesSchema,
  type BatchGroupTemplatesReq,
  type BatchGroupTemplatesRes,

  // Reminder Operation Types
  type ReminderOperationRes,
  type ReminderTriggerRes,
  type TemplateScheduleStatusRes,
} from './crud';

