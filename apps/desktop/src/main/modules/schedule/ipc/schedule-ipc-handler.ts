/**
 * Schedule IPC 处理器
 * 处理所有与计划任务相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import type { CreateScheduleTaskRequest, ScheduleTaskQueryParamsDTO } from '@dailyuse/contracts/schedule';

export class ScheduleIPCHandler extends BaseIPCHandler {
  private scheduleService: ScheduleDesktopApplicationService;

  constructor() {
    super('ScheduleIPCHandler');
    this.scheduleService = new ScheduleDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建计划任务
    ipcMain.handle('schedule:create-task', async (event, payload: { accountUuid: string; input: CreateScheduleTaskRequest }) => {
      return this.handleRequest(
        'schedule:create-task',
        () => this.scheduleService.createTask(payload.accountUuid, payload.input),
        { accountUuid: payload.accountUuid },
      );
    });

    // 获取计划任务
    ipcMain.handle('schedule:get-task', async (event, uuid: string) => {
      return this.handleRequest(
        'schedule:get-task',
        () => this.scheduleService.getTask(uuid),
      );
    });

    // 列出计划任务
    ipcMain.handle('schedule:list-tasks', async (event, params?: ScheduleTaskQueryParamsDTO) => {
      return this.handleRequest(
        'schedule:list-tasks',
        () => this.scheduleService.listTasks(params),
        { accountUuid: (params as any)?.accountUuid },
      );
    });

    // 更新计划任务
    ipcMain.handle('schedule:update-task', async (event, payload: { uuid: string; updates: any }) => {
      return this.handleRequest(
        'schedule:update-task',
        () => this.scheduleService.updateTask(payload.uuid, payload.updates),
      );
    });

    // 删除计划任务
    ipcMain.handle('schedule:delete-task', async (event, uuid: string) => {
      return this.handleRequest(
        'schedule:delete-task',
        () => this.scheduleService.deleteTask(uuid),
      );
    });

    // 暂停计划任务
    ipcMain.handle('schedule:pause-task', async (event, uuid: string) => {
      return this.handleRequest(
        'schedule:pause-task',
        () => this.scheduleService.pauseTask(uuid),
      );
    });

    // 恢复计划任务
    ipcMain.handle('schedule:resume-task', async (event, uuid: string) => {
      return this.handleRequest(
        'schedule:resume-task',
        () => this.scheduleService.resumeTask(uuid),
      );
    });

    // 按源实体列出任务
    ipcMain.handle('schedule:list-by-source', async (event, payload: { sourceModule: string; sourceEntityId: string }) => {
      return this.handleRequest(
        'schedule:list-by-source',
        () => this.scheduleService.listTasksBySourceEntity(payload.sourceModule, payload.sourceEntityId),
      );
    });

    // 按账户列出任务
    ipcMain.handle('schedule:list-by-account', async (event, accountUuid: string) => {
      return this.handleRequest(
        'schedule:list-by-account',
        () => this.scheduleService.listTasksByAccount(accountUuid),
        { accountUuid },
      );
    });

    // 重新调度任务
    ipcMain.handle('schedule:reschedule-task', async (event, payload: { uuid: string; newSchedule: { cronExpression?: string } }) => {
      return this.handleRequest(
        'schedule:reschedule-task',
        () => this.scheduleService.rescheduleTask(payload.uuid, payload.newSchedule),
      );
    });

    // 批量重新调度
    ipcMain.handle('schedule:batch-reschedule', async (event, tasks: Array<{ uuid: string; cronExpression: string }>) => {
      return this.handleRequest(
        'schedule:batch-reschedule',
        () => this.scheduleService.batchReschedule(tasks),
      );
    });

    // 查找到期任务
    ipcMain.handle('schedule:find-due-tasks', async (event, params?: { beforeTime?: Date }) => {
      return this.handleRequest(
        'schedule:find-due-tasks',
        () => this.scheduleService.findDueTasks(params),
      );
    });

    // 获取统计摘要
    ipcMain.handle('schedule:get-statistics-summary', async (event, accountUuid?: string) => {
      return this.handleRequest(
        'schedule:get-statistics-summary',
        () => this.scheduleService.getStatisticsSummary(accountUuid),
        { accountUuid },
      );
    });

    // 按日期范围获取统计
    ipcMain.handle('schedule:get-statistics-by-date-range', async (event, payload: { startDate: number; endDate: number; accountUuid?: string }) => {
      return this.handleRequest(
        'schedule:get-statistics-by-date-range',
        () => this.scheduleService.getStatisticsByDateRange(payload.startDate, payload.endDate, payload.accountUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    // 获取即将到期的任务
    ipcMain.handle('schedule:get-upcoming', async (event, payload: { days?: number; accountUuid?: string }) => {
      return this.handleRequest(
        'schedule:get-upcoming',
        () => this.scheduleService.getUpcoming(payload.days, payload.accountUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    this.logger.info('Registered Schedule IPC handlers');
  }
}

export const scheduleIPCHandler = new ScheduleIPCHandler();
