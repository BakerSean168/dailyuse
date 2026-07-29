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
 * @module reminder/electron
 */

import { ipcMain } from 'electron';
import { ok } from '@memoflow/contracts/result';
import {
  ReminderChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import { createReminderPowerSyncModule } from '../server/infrastructure';
import { ReminderController } from '../server/transport/reminder.controller';
import { createLogger } from '@memoflow/utils/logger';
import { withAuthenticatedValue } from './authenticated-ipc';
import type { ReminderModuleInstance } from '../server/infrastructure';
import type { IReminderTemplateRepository } from '../server/domain/repositories/i-reminder-template-repository';

const logger = createLogger('ReminderElectron');

const allChannels = Object.values(ReminderChannels);
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

    // 2. Controller (Zod validation + use case orchestration)
    //    控制器（Zod 验证 + 用例编排）
    const controller = new ReminderController(reminderModule.api);

    // 3. IPC Handlers — thin transport mapping
    //    IPC 处理器 — 精简的传输层映射

    // Template handlers / 模板处理器
    ipcMain.handle(ReminderChannels.TEMPLATE_LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.listTemplates(requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TEMPLATE_GET_BY_USER, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.listTemplates(requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TEMPLATE_GET, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getTemplate(id, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TEMPLATE_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createTemplate(dto, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TEMPLATE_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updateTemplate(id, dto, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TEMPLATE_DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await controller.deleteTemplate(id, requestContext);
        if (!result.ok) return result;
        return ok(null);
      }),
    );

    // Toggle template enabled/paused state.
    // 切换模板启用/暂停状态。
    ipcMain.handle(ReminderChannels.TEMPLATE_TOGGLE_ENABLED, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.toggleTemplate(id, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TEMPLATE_MOVE_TO_GROUP, async (_event, id, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.moveTemplate(id, payload ?? {}, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.UPCOMING_GET, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getUpcomingReminders(params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.TODAY_SCHEDULE_GET, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getTodaySchedule(params ?? {}, requestContext),
      ),
    );

    // Group handlers / 分组处理器
    ipcMain.handle(ReminderChannels.GROUP_LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) => controller.listGroups(requestContext)),
    );
    ipcMain.handle(ReminderChannels.GROUP_GET_BY_USER, async () =>
      withAuthenticatedValue(ctx, async (requestContext) => controller.listGroups(requestContext)),
    );
    ipcMain.handle(ReminderChannels.GROUP_GET, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getGroup(id, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.GROUP_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createGroup(dto, requestContext),
      ),
    );
    // Accept requestContext for consistency; updateGroup does not use it yet.
    // 为一致性接收 requestContext；updateGroup 目前尚未使用。
    ipcMain.handle(ReminderChannels.GROUP_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updateGroup(id, dto, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.GROUP_DELETE, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await controller.deleteGroup(id, requestContext);
        if (!result.ok) return result;
        return ok(null);
      }),
    );
    ipcMain.handle(ReminderChannels.GROUP_TOGGLE_STATUS, async (_event, id) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.toggleGroup(id, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.GROUP_SWITCH_CONTROL_MODE, async (_event, id, data) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.switchGroupControlMode(id, data, requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.PREFERENCES_GET, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.getPreferences(requestContext),
      ),
    );
    ipcMain.handle(ReminderChannels.PREFERENCES_UPDATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.updatePreferences(dto ?? {}, requestContext),
      ),
    );

    logger.info('Reminder module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    activeReminderModule?.dispose();
    activeReminderModule = null;
    logger.info('Reminder module destroyed');
  },
};

export {
  createReminderPowerSyncScheduleExecutionSource,
  createReminderPowerSyncScheduleProjectionSource,
} from '../server/infrastructure';
