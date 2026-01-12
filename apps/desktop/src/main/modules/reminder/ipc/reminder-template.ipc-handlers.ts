/**
 * Reminder Template IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * IPC 通道：提醒模板 CRUD 和状态管理
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';
import type { CreateReminderTemplateRequest, QueryReminderTemplatesRequest } from '@dailyuse/contracts/reminder';

export class ReminderTemplateIPCHandler extends BaseIPCHandler {
  private reminderService: ReminderDesktopApplicationService;

  constructor() {
    super('ReminderTemplateIPCHandler');
    this.reminderService = new ReminderDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建提醒模板
    ipcMain.handle(
      'reminder:template:create',
      async (_, accountUuid: string, input: CreateReminderTemplateRequest) => {
        return this.handleRequest('reminder:template:create', () =>
          this.reminderService.createTemplate(accountUuid, input),
        );
      },
    );

    // 获取单个提醒模板
    ipcMain.handle('reminder:template:get', async (_, uuid: string) => {
      return this.handleRequest('reminder:template:get', () =>
        this.reminderService.getTemplate(uuid),
      );
    });

    // 列出提醒模板
    ipcMain.handle(
      'reminder:template:list',
      async (_, accountUuid: string, params?: QueryReminderTemplatesRequest) => {
        return this.handleRequest('reminder:template:list', () =>
          this.reminderService.listTemplates(accountUuid, params),
        );
      },
    );

    // 更新提醒模板
    ipcMain.handle(
      'reminder:template:update',
      async (
        _,
        uuid: string,
        accountUuid: string,
        updates: { title?: string; description?: string },
      ) => {
        return this.handleRequest('reminder:template:update', () =>
          this.reminderService.updateTemplate(uuid, accountUuid, updates),
        );
      },
    );

    // 删除提醒模板
    ipcMain.handle(
      'reminder:template:delete',
      async (_, uuid: string, accountUuid: string) => {
        return this.handleRequest('reminder:template:delete', () =>
          this.reminderService.deleteTemplate(uuid, accountUuid),
        );
      },
    );

    // 启用模板
    ipcMain.handle('reminder:template:enable', async (_, uuid: string) => {
      return this.handleRequest('reminder:template:enable', () =>
        this.reminderService.enableTemplate(uuid),
      );
    });

    // 禁用模板
    ipcMain.handle('reminder:template:disable', async (_, uuid: string) => {
      return this.handleRequest('reminder:template:disable', () =>
        this.reminderService.disableTemplate(uuid),
      );
    });

    // 按分组列出模板
    ipcMain.handle(
      'reminder:template:listByGroup',
      async (_, groupUuid: string, accountUuid: string) => {
        return this.handleRequest('reminder:template:listByGroup', () =>
          this.reminderService.listTemplatesByGroup(groupUuid, accountUuid),
        );
      },
    );

    // 列出活跃模板
    ipcMain.handle(
      'reminder:template:listActive',
      async (_, accountUuid: string) => {
        return this.handleRequest('reminder:template:listActive', () =>
          this.reminderService.listActiveTemplates(accountUuid),
        );
      },
    );
  }
}

/**
 * 注册提醒模板 IPC 通道（已弃用）
 *
 * @deprecated 使用 ReminderTemplateIPCHandler 类代替
 */
export function registerReminderTemplateIpcHandlers(): void {
  const handler = new ReminderTemplateIPCHandler();
  (global as any).reminderTemplateIPCHandler = handler;
}

/**
 * 注销提醒模板 IPC 通道（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterReminderTemplateIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
