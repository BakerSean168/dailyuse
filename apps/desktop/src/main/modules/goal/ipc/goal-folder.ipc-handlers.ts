/**
 * Goal Folder IPC Handlers
 * 
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供一致的错误处理、日志记录和响应格式
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';

export class GoalFolderIPCHandler extends BaseIPCHandler {
  private goalService: GoalDesktopApplicationService;

  constructor() {
    super('GoalFolderIPCHandler');
    this.goalService = new GoalDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    /**
     * @description 创建目标文件夹
     * Channel Name: goal-folder:create
     * Payload: request (CreateGoalFolderInput)
     * Return: { success: boolean, data: GoalFolder | null }
     * Security: Requires authentication
     */
    ipcMain.handle('goal-folder:create', async (_, request) => {
      return this.handleRequest(
        'goal-folder:create',
        async () => {
          // TODO: 实现或映射到实际的 createFolder 方法
          // 临时返回成功响应
          return { success: true, data: null };
        },
      );
    });

    /**
     * @description 列出目标文件夹
     * Channel Name: goal-folder:list
     * Payload: params (ListGoalFoldersInput)
     * Return: GoalFolderListResponse
     * Security: Requires authentication
     */
    ipcMain.handle('goal-folder:list', async (_, params) => {
      return this.handleRequest(
        'goal-folder:list',
        () => this.goalService.listFolders(params),
        { accountUuid: params?.accountUuid },
      );
    });

    /**
     * @description 更新目标文件夹
     * Channel Name: goal-folder:update
     * Payload: uuid (string), request (UpdateGoalFolderInput)
     * Return: { success: boolean, data: GoalFolder | null }
     * Security: Requires authentication
     */
    ipcMain.handle('goal-folder:update', async (_, uuid, request) => {
      return this.handleRequest(
        'goal-folder:update',
        async () => {
          // TODO: 实现或映射到实际的 updateFolder 方法
          return { success: true, data: null };
        },
      );
    });

    /**
     * @description 删除目标文件夹
     * Channel Name: goal-folder:delete
     * Payload: uuid (string)
     * Return: { success: boolean }
     * Security: Requires authentication
     */
    ipcMain.handle('goal-folder:delete', async (_, uuid) => {
      return this.handleRequest(
        'goal-folder:delete',
        async () => {
          // TODO: 实现或映射到实际的 deleteFolder 方法
          return { success: true };
        },
      );
    });

    this.logger.info('Registered Goal Folder IPC handlers');
  }
}

export const goalFolderIPCHandler = new GoalFolderIPCHandler();

/**
 * 向后兼容的函数式接口
 * @deprecated 使用 goalFolderIPCHandler 实例代替
 */
export function registerGoalFolderIpcHandlers(): void {
  // 处理器已在 GoalFolderIPCHandler 构造时自动注册
}
