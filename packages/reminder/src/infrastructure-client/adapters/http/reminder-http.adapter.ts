/**
 * Reminder HTTP Adapter
 *
 * HTTP implementation of IReminderApiClient.
 */

import type {
  IHttpClient,
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

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== 模板 CRUD =====

  async createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO> {
    return this.httpClient.post(this.templatesUrl, request);
  }

  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.httpClient.get(`${this.templatesUrl}/${uuid}`);
  }

  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderTemplatesResponse> {
    return this.httpClient.get(this.templatesUrl, { params });
  }

  async getUserTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    return this.httpClient.get(`${this.templatesUrl}/user/${accountUuid}`);
  }

  async updateReminderTemplate(
    uuid: string,
    request: UpdateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO> {
    return this.httpClient.patch(`${this.templatesUrl}/${uuid}`, request);
  }

  async deleteReminderTemplate(uuid: string): Promise<void> {
    await this.httpClient.delete(`${this.templatesUrl}/${uuid}`);
  }

  async toggleTemplateEnabled(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.httpClient.post(`${this.templatesUrl}/${uuid}/toggle`, {});
  }

  async moveTemplateToGroup(
    templateUuid: string,
    targetGroupUuid: string | null,
  ): Promise<ReminderTemplateClientDTO> {
    return this.httpClient.post(`${this.templatesUrl}/${templateUuid}/move`, {
      targetGroupUuid,
    });
  }

  async searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    return this.httpClient.get(`${this.templatesUrl}/search`, {
      params: { accountUuid, query },
    });
  }

  async getTemplateScheduleStatus(templateUuid: string): Promise<TemplateScheduleStatusRes> {
    return this.httpClient.get(`${this.templatesUrl}/${templateUuid}/schedule-status`);
  }

  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<GetUpcomingRemindersRes> {
    return this.httpClient.get('/reminders/upcoming', { params });
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(
    request: CreateReminderGroupReq,
  ): Promise<ReminderGroupClientDTO> {
    return this.httpClient.post(this.groupsUrl, request);
  }

  async getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.httpClient.get(`${this.groupsUrl}/${uuid}`);
  }

  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderGroupsResponse> {
    return this.httpClient.get(this.groupsUrl, { params });
  }

  async getUserReminderGroups(accountUuid: string): Promise<ReminderGroupClientDTO[]> {
    return this.httpClient.get(`${this.groupsUrl}/user/${accountUuid}`);
  }

  async updateReminderGroup(
    uuid: string,
    request: UpdateReminderGroupReq,
  ): Promise<ReminderGroupClientDTO> {
    return this.httpClient.patch(`${this.groupsUrl}/${uuid}`, request);
  }

  async deleteReminderGroup(uuid: string): Promise<void> {
    await this.httpClient.delete(`${this.groupsUrl}/${uuid}`);
  }

  async toggleReminderGroupStatus(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.httpClient.post(`${this.groupsUrl}/${uuid}/toggle-status`, {});
  }

  async toggleReminderGroupControlMode(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.httpClient.post(`${this.groupsUrl}/${uuid}/toggle-control-mode`, {});
  }

  // ===== 统计 =====

  async getReminderStatistics(accountUuid: string): Promise<ReminderStatsClientDTO> {
    return this.httpClient.get(`/reminders/statistics/${accountUuid}`);
  }
}

/**
 * Factory function to create ReminderHttpAdapter
 */
export function createReminderHttpAdapter(httpClient: IHttpClient): ReminderHttpAdapter {
  return new ReminderHttpAdapter(httpClient);
}
