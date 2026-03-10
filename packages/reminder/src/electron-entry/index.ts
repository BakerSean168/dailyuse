/**
 * Reminder Module — Electron Entry Point
 *
 * @module reminder/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { ok } from '@dailyuse/contracts/result';
import { IdentityId } from '@dailyuse/domain-shared';
import { ReminderPowerSyncModule, ReminderContainer } from '../infrastructure-server/powersync';
import { createLogger } from '@dailyuse/utils';
import { ReminderTemplate } from '../domain-server/aggregates/reminder-template';
import { ReminderGroup } from '../domain-server/aggregates/reminder-group';
import { ReminderController, type ReminderUseCases } from '../controllers/reminder.controller';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('ReminderElectron');

const Ch = {
  TEMPLATE_LIST: 'reminder:template:list',
  TEMPLATE_GET: 'reminder:template:get',
  TEMPLATE_CREATE: 'reminder:template:create',
  TEMPLATE_UPDATE: 'reminder:template:update',
  TEMPLATE_DELETE: 'reminder:template:delete',
  TEMPLATE_TOGGLE_ENABLED: 'reminder:template:toggle-enabled',
  TEMPLATE_MOVE_TO_GROUP: 'reminder:template:move-to-group',
  GROUP_LIST: 'reminder:group:list',
  GROUP_CREATE: 'reminder:group:create',
  GROUP_UPDATE: 'reminder:group:update',
  GROUP_DELETE: 'reminder:group:delete',
} as const;

const channels = Object.values(Ch);

export const ReminderElectronModule: IElectronModule = {
  name: 'Reminder',

  register(ctx: IElectronModuleContext): void {
    const mod = new ReminderPowerSyncModule(ctx.db);

    const templateRepo = mod.reminderTemplateRepository;
    const groupRepo = mod.reminderGroupRepository;
    const controller = new ReminderController({
      createTemplate: async (data, requestContext) => {
        const normalizedInput = {
          ...data,
          activeTime: {
            activatedAt: data.activeTime?.startDate,
          },
          activeHours: data.activeHours
            ? {
                enabled: true,
                startHour: data.activeHours.startHour,
                endHour: data.activeHours.endHour,
              }
            : undefined,
          recurrence: data.recurrence
            ? { ...data.recurrence, weekly: data.recurrence.weekly ?? null }
            : undefined,
          notificationConfig: {
            ...data.notificationConfig,
            actions: data.notificationConfig?.actions ?? null,
          },
        };
        const template = ReminderTemplate.create({
          ...normalizedInput,
          identityId: IdentityId.of(requestContext.identityId),
        });
        await templateRepo.save(template);
        return ok(template.toClientDTO());
      },
      listTemplates: async (requestContext) => {
        const templates = await templateRepo.findByIdentityId(requestContext.identityId);
        const data = templates.map((template) => template.toClientDTO());
        return ok({
          templates: data,
          total: data.length,
          page: 1,
          pageSize: data.length,
          hasMore: false,
        });
      },
      getUpcomingReminders: async () => ok({ data: [], total: 0 }),
      getTemplate: async (id) => ok(await templateRepo.findById(id)),
      updateTemplate: async (id, data) => {
        const existing = await templateRepo.findById(id);
        if (!existing) {
          throw new Error('Template not found');
        }

        const normalizedUpdates: Record<string, unknown> = { ...data };
        if (data.activeTime) {
          normalizedUpdates.activeTime = { activatedAt: data.activeTime.startDate };
        }
        if (data.activeHours) {
          normalizedUpdates.activeHours = {
            enabled: true,
            startHour: data.activeHours.startHour,
            endHour: data.activeHours.endHour,
          };
        }
        if (data.recurrence) {
          normalizedUpdates.recurrence = {
            ...data.recurrence,
            weekly: data.recurrence.weekly ?? null,
          };
        }
        if (data.notificationConfig) {
          normalizedUpdates.notificationConfig = {
            ...data.notificationConfig,
            actions: data.notificationConfig.actions ?? null,
          };
        }

        existing.update(normalizedUpdates as Parameters<ReminderTemplate['update']>[0]);
        await templateRepo.save(existing);
        return ok(existing.toClientDTO());
      },
      deleteTemplate: async (id) => {
        await templateRepo.delete(id);
        return ok(undefined);
      },
      enableTemplate: async () => ok(undefined),
      pauseTemplate: async () => ok(undefined),
      toggleTemplate: async () => ok(undefined),
      moveTemplate: async () => ok(undefined),
      getTemplateHistory: async () => ok(undefined),
      recordResponse: async () => ok(undefined),
      getTemplateResponses: async () => ok(undefined),
      getResponseStats: async () => ok(undefined),
      analyzeFrequency: async () => ok(undefined),
      adjustFrequency: async () => ok(undefined),
      rejectFrequencyAdjustment: async () => ok(undefined),
      createGroup: async (data, requestContext) => {
        const group = ReminderGroup.create({
          ...data,
          identityId: requestContext.identityId,
        });
        await groupRepo.save(group);
        return ok(group.toClientDTO());
      },
      listGroups: async (requestContext) => {
        const groups = await groupRepo.findByIdentityId(requestContext.identityId);
        const data = groups.map((group) => group.toClientDTO());
        return ok({
          groups: data,
          total: data.length,
          page: 1,
          pageSize: data.length,
          hasMore: false,
        });
      },
      getGroup: async (id) => ok(await groupRepo.findById(id)),
      updateGroup: async (id, data) => {
        const existing = await groupRepo.findById(id);
        if (!existing) {
          throw new Error('Group not found');
        }

        const updated = ReminderGroup.load({
          id: existing.id,
          identityId: existing.identityId as string,
          name: data.name ?? existing.name,
          description: 'description' in data ? (data.description ?? null) : existing.description,
          controlMode: data.controlMode ?? existing.controlMode,
          enabled: existing.enabled,
          status: existing.status,
          order: data.order ?? existing.order,
          color: 'color' in data ? (data.color ?? null) : existing.color,
          icon: 'icon' in data ? (data.icon ?? null) : existing.icon,
          stats: existing.stats as any,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
          deletedAt: existing.deletedAt?.getTime() ?? null,
          version: existing.version,
        });
        await groupRepo.save(updated);
        return ok(updated.toClientDTO());
      },
      deleteGroup: async (id) => {
        await groupRepo.delete(id);
        return ok(undefined);
      },
      switchGroupControlMode: async () => ok(undefined),
      batchGroupTemplates: async () => ok(undefined),
      toggleGroup: async () => ok(undefined),
      getPreferences: async () => ok(undefined),
      updatePreferences: async () => ok(undefined),
    } satisfies ReminderUseCases);

    // Template handlers
    ipcMain.handle(Ch.TEMPLATE_LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.listTemplates(requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_GET, (_event, id) => controller.getTemplate(id));
    ipcMain.handle(Ch.TEMPLATE_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createTemplate(dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async () => controller.updateTemplate(id, dto)),
    );
    ipcMain.handle(Ch.TEMPLATE_DELETE, (_event, id) => controller.deleteTemplate(id));

    // Group handlers
    ipcMain.handle(Ch.GROUP_LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) => controller.listGroups(requestContext)),
    );
    ipcMain.handle(Ch.GROUP_CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        controller.createGroup(dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.GROUP_UPDATE, async (_event, id, dto) =>
      withAuthenticatedValue(ctx, async () => controller.updateGroup(id, dto)),
    );
    ipcMain.handle(Ch.GROUP_DELETE, (_event, id) => controller.deleteGroup(id));

    logger.info('Reminder module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    ReminderContainer.getInstance().reset();
    logger.info('Reminder module destroyed');
  },
};
