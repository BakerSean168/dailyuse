/**
 * Reminder Desktop Application Service - Facade Pattern
 *
 * 包装 @dailyuse/reminder/application-server 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 * 
 * 所有具体的业务逻辑都委托给 services 文件夹中的专门服务
 */

import {
  createTemplateService,
  getTemplateService,
  listTemplatesService,
  updateTemplateService,
  deleteTemplateService,
  enableTemplateService,
  pauseTemplateService,
  listTemplatesByGroupService,
  listActiveTemplatesService,
  createGroupService,
  getGroupService,
  listGroupsService,
  updateGroupService,
  deleteGroupService,
  getUpcomingService,
} from './services';

import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
  CreateReminderTemplateRequest,
  QueryReminderTemplatesRequest,
} from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderDesktopAppService');

export class ReminderDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Reminder Template =====

  async createTemplate(accountUuid: string, input: CreateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    return createTemplateService(accountUuid, input);
  }

  async getTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    return getTemplateService(uuid);
  }

  async listTemplates(accountUuid: string, params?: QueryReminderTemplatesRequest): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    return listTemplatesService(accountUuid, params);
  }

  async updateTemplate(
    uuid: string,
    _accountUuid: string,
    updates: { title?: string; description?: string },
  ): Promise<ReminderTemplateClientDTO> {
    return updateTemplateService(uuid, _accountUuid, updates);
  }

  async deleteTemplate(uuid: string, accountUuid: string): Promise<void> {
    return deleteTemplateService(uuid, accountUuid);
  }

  async enableTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return enableTemplateService(uuid);
  }

  async disableTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return pauseTemplateService(uuid);
  }

  async listTemplatesByGroup(groupUuid: string, accountUuid: string): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    return listTemplatesByGroupService(groupUuid, accountUuid);
  }

  async listActiveTemplates(accountUuid: string): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    return listActiveTemplatesService(accountUuid);
  }

  // ===== Reminder Groups =====

  async createGroup(params: {
    accountUuid: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<ReminderGroupClientDTO> {
    return createGroupService(params);
  }

  async getGroup(uuid: string): Promise<ReminderGroupClientDTO | null> {
    return getGroupService(uuid);
  }

  async listGroups(accountUuid: string): Promise<{
    groups: ReminderGroupClientDTO[];
    total: number;
  }> {
    return listGroupsService(accountUuid);
  }

  async updateGroup(
    uuid: string,
    _updates: { name?: string; description?: string; color?: string; icon?: string },
  ): Promise<ReminderGroupClientDTO> {
    return updateGroupService(uuid, _updates);
  }

  async deleteGroup(uuid: string): Promise<void> {
    return deleteGroupService(uuid);
  }

  // ===== Reminder Upcoming =====

  async getUpcoming(days: number = 7, accountUuid: string): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    return getUpcomingService(days, accountUuid);
  }
}
