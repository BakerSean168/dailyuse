/**
 * Goal IPC 处理器
 * 处理所有与目标相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import type { CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';

export class GoalIPCHandler extends BaseIPCHandler {
  private goalService: GoalDesktopApplicationService;

  constructor() {
    super('GoalIPCHandler');
    this.goalService = new GoalDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    /**
     * @description 创建目标
     * Channel Name: goal:create
     * Payload: { accountUuid: string; params: CreateGoalRequest }
     * Return: Goal
     * Security: Requires authentication
     */
    ipcMain.handle('goal:create', async (event, payload: { accountUuid: string; params: CreateGoalRequest }) => {
      return this.handleRequest(
        'goal:create',
        () => this.goalService.createGoal(payload.accountUuid, payload.params),
        { accountUuid: payload.accountUuid },
      );
    });

    /**
     * @description 获取目标详情
     * Channel Name: goal:get
     * Payload: { uuid: string; includeChildren?: boolean }
     * Return: Goal
     * Security: Requires authentication
     */
    ipcMain.handle('goal:get', async (event, payload: { uuid: string; includeChildren?: boolean }) => {
      return this.handleRequest(
        'goal:get',
        () => this.goalService.getGoal(payload.uuid, payload.includeChildren),
      );
    });

    /**
     * @description 列出目标
     * Channel Name: goal:list
     * Payload: params (ListGoalInput)
     * Return: Goal[]
     * Security: Requires authentication
     */
    ipcMain.handle('goal:list', async (event, params: { accountUuid?: string; status?: GoalStatus[]; folderUuid?: string; includeChildren?: boolean }) => {
      return this.handleRequest(
        'goal:list',
        () => this.goalService.listGoals(params),
        { accountUuid: params.accountUuid },
      );
    });

    /**
     * @description 更新目标
     * Channel Name: goal:update
     * Payload: { uuid: string; params: UpdateGoalRequest }
     * Return: Goal
     * Security: Requires authentication
     */
    ipcMain.handle('goal:update', async (event, payload: { uuid: string; params: UpdateGoalRequest }) => {
      return this.handleRequest(
        'goal:update',
        () => this.goalService.updateGoal(payload.uuid, payload.params),
      );
    });

    /**
     * @description 删除目标
     * Channel Name: goal:delete
     * Payload: uuid (string)
     * Return: void
     * Security: Requires authentication
     */
    ipcMain.handle('goal:delete', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:delete',
        () => this.goalService.deleteGoal(uuid),
      );
    });

    /**
     * @description 激活目标
     * Channel Name: goal:activate
     * Payload: uuid (string)
     * Return: Goal
     * Security: Requires authentication
     */
    ipcMain.handle('goal:activate', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:activate',
        () => this.goalService.activateGoal(uuid),
      );
    });

    /**
     * @description 归档目标
     * Channel Name: goal:archive
     * Payload: uuid (string)
     * Return: Goal
     * Security: Requires authentication
     */
    ipcMain.handle('goal:archive', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:archive',
        () => this.goalService.archiveGoal(uuid),
      );
    });

    /**
     * @description 完成目标
     * Channel Name: goal:complete
     * Payload: uuid (string)
     * Return: Goal
     * Security: Requires authentication
     */
    ipcMain.handle('goal:complete', async (event, uuid: string) => {
      return this.handleRequest(
        'goal:complete',
        () => this.goalService.completeGoal(uuid),
      );
    });

    this.logger.info('Registered Goal IPC handlers');
  }
}

export const goalIPCHandler = new GoalIPCHandler();
