/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 */

/**
 * Reminder Client Service
 *
 * Constructor-injected application service for reminder management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/reminder-client-service
 */

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
} from '@dailyuse/contracts/reminder';
import type { ControlMode } from '@dailyuse/contracts/reminder';
import type { IReminderApiClient } from '../infrastructure-client/adapters/types';

export class ReminderClientService {
  constructor(private readonly reminderApi: IReminderApiClient) {
    this.createReminderTemplate = this.createReminderTemplate.bind(this);
    this.getReminderTemplate = this.getReminderTemplate.bind(this);
    this.getReminderTemplates = this.getReminderTemplates.bind(this);
    this.getUserTemplates = this.getUserTemplates.bind(this);
    this.updateReminderTemplate = this.updateReminderTemplate.bind(this);
    this.deleteReminderTemplate = this.deleteReminderTemplate.bind(this);
    this.toggleTemplateEnabled = this.toggleTemplateEnabled.bind(this);
    this.moveTemplateToGroup = this.moveTemplateToGroup.bind(this);
    this.getUpcomingReminders = this.getUpcomingReminders.bind(this);
    this.createReminderGroup = this.createReminderGroup.bind(this);
    this.getReminderGroup = this.getReminderGroup.bind(this);
    this.getReminderGroups = this.getReminderGroups.bind(this);
    this.getUserReminderGroups = this.getUserReminderGroups.bind(this);
    this.updateReminderGroup = this.updateReminderGroup.bind(this);
    this.deleteReminderGroup = this.deleteReminderGroup.bind(this);
    this.toggleReminderGroupStatus = this.toggleReminderGroupStatus.bind(this);
    this.switchReminderGroupControlMode = this.switchReminderGroupControlMode.bind(this);
    this.getPreferences = this.getPreferences.bind(this);
    this.updatePreferences = this.updatePreferences.bind(this);
  }

  // ===== 模板 CRUD =====

  async createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.createReminderTemplate(request);
  }

  async getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.getReminderTemplate(id);
  }

  async getReminderTemplates(): Promise<Result<ReminderTemplateListRes>> {
    return this.reminderApi.getReminderTemplates();
  }

  async getUserTemplates(): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.reminderApi.getUserTemplates();
  }

  async updateReminderTemplate(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.updateReminderTemplate(id, request);
  }

  async deleteReminderTemplate(id: string): Promise<Result<void>> {
    return this.reminderApi.deleteReminderTemplate(id);
  }

  async toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.toggleTemplateEnabled(id);
  }

  async moveTemplateToGroup(
    templateId: string,
    targetGroupId: string | null,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.moveTemplateToGroup(templateId, targetGroupId);
  }

  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<Result<GetUpcomingRemindersRes>> {
    return this.reminderApi.getUpcomingReminders(params);
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(
    request: CreateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.createReminderGroup(request);
  }

  async getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.getReminderGroup(id);
  }

  async getReminderGroups(): Promise<Result<ReminderGroupListRes>> {
    return this.reminderApi.getReminderGroups();
  }

  async getUserReminderGroups(): Promise<Result<ReminderGroupClientDTO[]>> {
    return this.reminderApi.getUserReminderGroups();
  }

  async updateReminderGroup(
    id: string,
    request: UpdateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.updateReminderGroup(id, request);
  }

  async deleteReminderGroup(id: string): Promise<Result<void>> {
    return this.reminderApi.deleteReminderGroup(id);
  }

  async toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.toggleReminderGroupStatus(id);
  }

  async switchReminderGroupControlMode(
    id: string,
    mode: ControlMode,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.switchReminderGroupControlMode(id, mode);
  }

  async getPreferences(): Promise<Result<UserReminderPreferencesClientDTO>> {
    return (this.reminderApi as any).getPreferences();
  }

  async updatePreferences(
    data: Record<string, unknown>,
  ): Promise<Result<UserReminderPreferencesClientDTO>> {
    return (this.reminderApi as any).updatePreferences(data);
  }
}
