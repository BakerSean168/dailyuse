import type { Result } from '@dailyuse/contracts/result';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderTemplateListRes,
  ReminderGroupListRes,
  UserReminderPreferencesClientDTO,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
  GetUpcomingRemindersRes,
  GetReminderTodayScheduleRes,
  ControlMode,
} from '@dailyuse/contracts/reminder';

export interface ReminderClientPort {
  // Template CRUD
  createReminderTemplate(request: CreateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplates(): Promise<Result<ReminderTemplateListRes>>;
  getUserTemplates(): Promise<Result<ReminderTemplateClientDTO[]>>;
  updateReminderTemplate(id: string, request: UpdateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>>;
  deleteReminderTemplate(id: string): Promise<Result<void>>;
  toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>>;
  moveTemplateToGroup(templateId: string, targetGroupId: string | null): Promise<Result<ReminderTemplateClientDTO>>;
  getUpcomingReminders(params?: { days?: number; limit?: number; importanceLevel?: string; type?: string }): Promise<Result<GetUpcomingRemindersRes>>;
  getTodaySchedule(params?: { limit?: number; includeExpired?: boolean }): Promise<Result<GetReminderTodayScheduleRes>>;

  // Group CRUD
  createReminderGroup(request: CreateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroups(): Promise<Result<ReminderGroupListRes>>;
  getUserReminderGroups(): Promise<Result<ReminderGroupClientDTO[]>>;
  updateReminderGroup(id: string, request: UpdateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  deleteReminderGroup(id: string): Promise<Result<void>>;
  toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>>;
  switchReminderGroupControlMode(id: string, mode: ControlMode): Promise<Result<ReminderGroupClientDTO>>;

  // Preferences
  getPreferences(): Promise<Result<UserReminderPreferencesClientDTO>>;
  updatePreferences(data: Record<string, unknown>): Promise<Result<UserReminderPreferencesClientDTO>>;
}
