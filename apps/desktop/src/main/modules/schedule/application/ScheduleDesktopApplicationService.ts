/**
 * Schedule Desktop Application Service - Facade Pattern
 *
 * 包装 @dailyuse/schedule/application-server 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 * 
 * 所有具体的业务逻辑都委托给 services 文件夹中的专门服务
 */

import {
  createTaskService,
  getTaskService,
  listTasksService,
  updateTaskService,
  deleteTaskService,
  pauseTaskService,
  resumeTaskService,
  listTasksBySourceEntityService,
  listTasksByAccountService,
  rescheduleTaskService,
  batchRescheduleService,
  findDueTasksService,
  getUpcomingService,
} from './services';

import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
  ScheduleTaskQueryParamsDTO,
} from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleDesktopAppService');

export class ScheduleDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Schedule Task =====

  async createTask(accountUuid: string, input: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO> {
    return createTaskService(accountUuid, input);
  }

  async getTask(uuid: string): Promise<ScheduleTaskClientDTO | null> {
    return getTaskService(uuid);
  }

  async listTasks(params?: ScheduleTaskQueryParamsDTO): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    return listTasksService(params);
  }

  async updateTask(
    uuid: string,
    updates: { description?: string; schedule?: { cronExpression?: string } },
  ): Promise<ScheduleTaskClientDTO> {
    return updateTaskService(uuid, updates);
  }

  async deleteTask(uuid: string): Promise<void> {
    return deleteTaskService(uuid);
  }

  async pauseTask(uuid: string): Promise<{ success: boolean }> {
    return pauseTaskService(uuid);
  }

  async resumeTask(uuid: string): Promise<{ success: boolean }> {
    return resumeTaskService(uuid);
  }

  async listTasksBySourceEntity(
    sourceModule: string,
    sourceEntityId: string,
  ): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    return listTasksBySourceEntityService(sourceModule, sourceEntityId);
  }

  async listTasksByAccount(accountUuid: string): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    return listTasksByAccountService(accountUuid);
  }

  async rescheduleTask(
    uuid: string,
    newSchedule: { cronExpression?: string },
  ): Promise<ScheduleTaskClientDTO> {
    return rescheduleTaskService(uuid, newSchedule);
  }

  async batchReschedule(
    tasks: Array<{ uuid: string; cronExpression: string }>,
  ): Promise<{ success: boolean; count: number }> {
    return batchRescheduleService(tasks);
  }

  // ===== Due Tasks =====

  async findDueTasks(params?: { beforeTime?: Date }): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    return findDueTasksService(params);
  }

  async getUpcoming(days: number = 7, accountUuid?: string): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    return getUpcomingService(days, accountUuid);
  }
}
