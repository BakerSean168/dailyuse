/**
 * Reminder HTTP Adapter
 *
 * HTTP implementation of IReminderApiClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  IReminderApiClient,
  ReminderTemplatesResponse,
  ReminderGroupsResponse,
} from '../types';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatsClientDTO,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
  GetUpcomingRemindersRes,
  TemplateScheduleStatusRes,
} from '@dailyuse/contracts/reminder';

/**
 * ReminderHttpAdapter
 *
 * HTTP 实现的提�?API 客户�?
 */
export class ReminderHttpAdapter implements IReminderApiClient {
  private readonly templatesUrl = '/reminders/templates';
  private readonly groupsUrl = '/reminder-groups';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== 模板 CRUD =====

  async createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.httpClient.post(this.templatesUrl, request);
  }

  async getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.httpClient.get(`${this.templatesUrl}/${id}`);
  }

  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<Result<ReminderTemplatesResponse>> {
    return this.httpClient.get(this.templatesUrl, { params });
  }

  async getUserTemplates(identityId: string): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.httpClient.get(`${this.templatesUrl}/user/${identityId}`);
  }

  async updateReminderTemplate(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.httpClient.patch(`${this.templatesUrl}/${id}`, request);
  }

  async deleteReminderTemplate(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.templatesUrl}/${id}`);
  }

  async toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.httpClient.post(`${this.templatesUrl}/${id}/toggle`, {});
  }

  async moveTemplateToGroup(
    templateId: string,
    targetGroupId: string | null,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.httpClient.post(`${this.templatesUrl}/${templateId}/move`, {
      targetGroupId,
    });
  }

  async searchTemplates(
    identityId: string,
    query: string,
  ): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.httpClient.get(`${this.templatesUrl}/search`, {
      params: { identityId, query },
    });
  }

  async getTemplateScheduleStatus(templateId: string): Promise<Result<TemplateScheduleStatusRes>> {
    return this.httpClient.get(`${this.templatesUrl}/${templateId}/schedule-status`);
  }

  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<Result<GetUpcomingRemindersRes>> {
    return this.httpClient.get('/reminders/upcoming', { params });
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(
    request: CreateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.httpClient.post(this.groupsUrl, request);
  }

  async getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.httpClient.get(`${this.groupsUrl}/${id}`);
  }

  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<Result<ReminderGroupsResponse>> {
    return this.httpClient.get(this.groupsUrl, { params });
  }

  async getUserReminderGroups(identityId: string): Promise<Result<ReminderGroupClientDTO[]>> {
    return this.httpClient.get(`${this.groupsUrl}/user/${identityId}`);
  }

  async updateReminderGroup(
    id: string,
    request: UpdateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.httpClient.patch(`${this.groupsUrl}/${id}`, request);
  }

  async deleteReminderGroup(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.groupsUrl}/${id}`);
  }

  async toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.httpClient.post(`${this.groupsUrl}/${id}/toggle-status`, {});
  }

  async toggleReminderGroupControlMode(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.httpClient.post(`${this.groupsUrl}/${id}/toggle-control-mode`, {});
  }

  // ===== 统计 =====

  async getReminderStatistics(identityId: string): Promise<Result<ReminderStatsClientDTO>> {
    return this.httpClient.get(`/reminders/statistics/${identityId}`);
  }
}

/**
 * Factory function to create ReminderHttpAdapter
 */
export function createReminderHttpAdapter(httpClient: IResultHttpClient): ReminderHttpAdapter {
  return new ReminderHttpAdapter(httpClient);
}
