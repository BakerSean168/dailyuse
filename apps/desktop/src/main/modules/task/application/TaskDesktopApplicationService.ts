/**
 * Task Desktop Application Service
 * 
 * Facade pattern - 为 IPC handlers 提供统一入口
 * 实际逻辑分散在独立的 use case 文件中
 */

import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateRequest,
  QueryTaskTemplatesRequest,
  CreateOneTimeTaskRequest,
  TaskDashboardResponse,
} from '@dailyuse/contracts/task';

// Import all use cases
import {
  createTemplateUseCase,
  createOneTimeTaskUseCase,
  getTemplateUseCase,
  listTemplatesUseCase,
  updateTemplateUseCase,
  deleteTemplateUseCase,
  activateTemplateUseCase,
  pauseTemplateUseCase,
  archiveTemplateUseCase,
  restoreTemplateUseCase,
} from './services/template';

import {
  getInstanceUseCase,
  listInstancesUseCase,
  completeInstanceUseCase,
  skipInstanceUseCase,
  startInstanceUseCase,
  deleteInstanceUseCase,
  listInstancesByDateRangeUseCase,
  listInstancesByTemplateUseCase,
} from './services/instance';

import { getDashboardUseCase } from './services/dashboard';

/**
 * Task Desktop Application Service
 * 作为 facade 层，将请求委托给具体的 use case
 */
export class TaskDesktopApplicationService {
  // ===== Task Template =====

  async createTemplate(input: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    return createTemplateUseCase(input);
  }

  async createOneTimeTask(input: CreateOneTimeTaskRequest): Promise<TaskTemplateClientDTO> {
    return createOneTimeTaskUseCase(input);
  }

  async getTemplate(uuid: string): Promise<TaskTemplateClientDTO | null> {
    return getTemplateUseCase(uuid);
  }

  async listTemplates(params: QueryTaskTemplatesRequest): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    return listTemplatesUseCase(params);
  }

  async updateTemplate(uuid: string, updates: Partial<CreateTaskTemplateRequest>): Promise<TaskTemplateClientDTO> {
    return updateTemplateUseCase(uuid, updates);
  }

  async deleteTemplate(uuid: string): Promise<void> {
    return deleteTemplateUseCase(uuid);
  }

  async activateTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return activateTemplateUseCase(uuid);
  }

  async pauseTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return pauseTemplateUseCase(uuid);
  }

  async archiveTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return archiveTemplateUseCase(uuid);
  }

  async restoreTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return restoreTemplateUseCase(uuid);
  }

  // ===== Task Instance =====

  async getInstance(uuid: string): Promise<TaskInstanceClientDTO | null> {
    return getInstanceUseCase(uuid);
  }

  async listInstances(params: { templateUuid?: string; accountUuid: string }): Promise<{
    instances: TaskInstanceClientDTO[];
    total: number;
  }> {
    return listInstancesUseCase(params);
  }

  async completeInstance(
    uuid: string,
    completion?: { duration?: number; note?: string; rating?: number }
  ): Promise<TaskInstanceClientDTO> {
    return completeInstanceUseCase(uuid, completion);
  }

  async skipInstance(uuid: string, reason?: string): Promise<TaskInstanceClientDTO> {
    return skipInstanceUseCase(uuid, reason);
  }

  async startInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    return startInstanceUseCase(uuid);
  }

  async deleteInstance(uuid: string): Promise<void> {
    return deleteInstanceUseCase(uuid);
  }

  async listInstancesByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number
  ): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
    return listInstancesByDateRangeUseCase(accountUuid, startDate, endDate);
  }

  async listInstancesByTemplate(templateUuid: string): Promise<{
    instances: TaskInstanceClientDTO[];
    total: number;
  }> {
    return listInstancesByTemplateUseCase(templateUuid);
  }

  async listInstancesByDate(date: number, accountUuid: string): Promise<{
    instances: TaskInstanceClientDTO[];
    total: number;
  }> {
    // Use date range with same start and end
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return listInstancesByDateRangeUseCase(accountUuid, dayStart.getTime(), dayEnd.getTime());
  }

  // ===== Dashboard =====

  async getDashboard(accountUuid: string): Promise<TaskDashboardResponse> {
    return getDashboardUseCase(accountUuid);
  }

  // ===== Batch Operations (Placeholder) =====

  async batchUpdateTemplates(
    updates: Array<{ uuid: string; changes: Partial<CreateTaskTemplateRequest> }>
  ): Promise<{ success: boolean; count: number }> {
    let count = 0;
    for (const update of updates) {
      try {
        await this.updateTemplate(update.uuid, update.changes);
        count++;
      } catch (error) {
        console.warn(`Failed to update template ${update.uuid}`, error);
      }
    }
    return { success: true, count };
  }

  async batchCompleteInstances(uuids: string[]): Promise<{ success: boolean; count: number }> {
    let count = 0;
    for (const uuid of uuids) {
      try {
        await this.completeInstance(uuid);
        count++;
      } catch (error) {
        console.warn(`Failed to complete instance ${uuid}`, error);
      }
    }
    return { success: true, count };
  }
}
