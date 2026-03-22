/**
 * Reminder Module — Electron Entry Point.
 * 提醒模块 — Electron 入口点。
 *
 * Self-contained reminder runtime assembly for Electron main process.
 * 提醒模块在 Electron 主进程中的自包含运行时组装。
 *
 * Uses the same composition root as the API module (createReminderPowerSyncModule),
 * and registers IPC handlers using the shared ReminderController.
 *
 * 使用与 API 模块相同的组合根（createReminderPowerSyncModule），
 * 并通过共享的 ReminderController 注册 IPC 处理器。
 *
 * @module reminder/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createReminderPowerSyncModule } from '../infrastructure-server/powersync';
import { ReminderController } from '../controllers/reminder.controller';
import { createReminderTransportHandlers } from '../api/transport-handlers';
import { createLogger } from '@dailyuse/utils';
import { withAuthenticatedValue } from './authenticated-ipc';
import type { ReminderModuleInstance } from '../infrastructure-server';
import type { IReminderTemplateRepository } from '../domain-server/repositories/IReminderTemplateRepository';

const logger = createLogger('ReminderElectron');

const Ch = {
  TEMPLATE_LIST: 'reminder:template:list',
  TEMPLATE_GET: 'reminder:template:get',
  TEMPLATE_CREATE: 'reminder:template:create',
  TEMPLATE_UPDATE: 'reminder:template:update',
  TEMPLATE_DELETE: 'reminder:template:delete',
  TEMPLATE_TOGGLE_ENABLED: 'reminder:template:toggle-enabled',
  TEMPLATE_MOVE_TO_GROUP: 'reminder:template:move-to-group',
  TEMPLATE_GET_BY_USER: 'reminder:template:get-by-user',
  UPCOMING_GET: 'reminder:upcoming:get',
  GROUP_LIST: 'reminder:group:list',
  GROUP_GET: 'reminder:group:get',
  GROUP_CREATE: 'reminder:group:create',
  GROUP_UPDATE: 'reminder:group:update',
  GROUP_DELETE: 'reminder:group:delete',
  GROUP_GET_BY_USER: 'reminder:group:get-by-user',
  GROUP_TOGGLE_STATUS: 'reminder:group:toggle-status',
  GROUP_SWITCH_CONTROL_MODE: 'reminder:group:switch-control-mode',
  PREFERENCES_GET: 'reminder:preferences:get',
  PREFERENCES_UPDATE: 'reminder:preferences:update',
} as const;

const channels = Object.values(Ch);
let activeReminderModule: ReminderModuleInstance | null = null;

export function getReminderTemplateRepository(): IReminderTemplateRepository {
  if (!activeReminderModule) {
    throw new Error('Reminder module not registered yet');
  }

  return activeReminderModule.reminderTemplateRepository;
}

export const ReminderElectronModule: IElectronModule = {
  name: 'Reminder',

  register(ctx: IElectronModuleContext): void {
    // 1. Composition Root — same factory as API, different adapters
    //    组合根 — 与 API 相同的工厂，不同的适配器
    const reminderModule = createReminderPowerSyncModule(ctx.db);
    activeReminderModule = reminderModule;
    reminderModule.start();

    // 2. Controller (Zod validation + use case orchestration via shared transport handlers)
    //    控制器（Zod 验证 + 通过共享传输处理器的用例编排）
    const controller = new ReminderController(createReminderTransportHandlers(reminderModule.api));

    // 3. IPC Handlers — thin transport mapping
    //    IPC 处理器 — 精简的传输层映射

    // Template handlers / 模板处理器
    ipcMain.handle(Ch.TEMPLATE_LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.listTemplates(requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_BY_USER, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.listTemplates(requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_GET, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getTemplate(id, requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createTemplate(dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updateTemplate(id, dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.deleteTemplate(id, requestContext),
      ),
    );

    // Toggle template enabled/paused state.
    // 切换模板启用/暂停状态。
    ipcMain.handle(Ch.TEMPLATE_TOGGLE_ENABLED, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.toggleTemplate(id, requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_MOVE_TO_GROUP, async (_event, id, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.moveTemplate(id, payload ?? {}, requestContext),
      ),
    );
    ipcMain.handle(Ch.UPCOMING_GET, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getUpcomingReminders(params ?? {}, requestContext),
      ),
    );

    // Group handlers / 分组处理器
    ipcMain.handle(Ch.GROUP_LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) => controller.listGroups(requestContext)),
    );
    ipcMain.handle(Ch.GROUP_GET_BY_USER, async () =>
      withAuthenticatedValue(ctx, async (requestContext) => controller.listGroups(requestContext)),
    );
    ipcMain.handle(Ch.GROUP_GET, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getGroup(id, requestContext),
      ),
    );
    ipcMain.handle(Ch.GROUP_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createGroup(dto, requestContext),
      ),
    );
    // Accept requestContext for consistency; updateGroup does not use it yet.
    // 为一致性接收 requestContext；updateGroup 目前尚未使用。
    ipcMain.handle(Ch.GROUP_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updateGroup(id, dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.GROUP_DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.deleteGroup(id, requestContext),
      ),
    );
    ipcMain.handle(Ch.GROUP_TOGGLE_STATUS, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.toggleGroup(id, requestContext),
      ),
    );
    ipcMain.handle(Ch.GROUP_SWITCH_CONTROL_MODE, async (_event, id, data) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.switchGroupControlMode(id, data, requestContext),
      ),
    );
    ipcMain.handle(Ch.PREFERENCES_GET, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getPreferences(requestContext),
      ),
    );
    ipcMain.handle(Ch.PREFERENCES_UPDATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updatePreferences(dto ?? {}, requestContext),
      ),
    );

    logger.info('Reminder module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeReminderModule?.dispose();
    activeReminderModule = null;
    logger.info('Reminder module destroyed');
  },
};
