/**
 * Reminder API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (ReminderModule → Repositories → Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { ok } from '@dailyuse/contracts/result';
import { ReminderModule } from '../infrastructure-server';
import { ReminderContainer } from '../infrastructure-server/di/reminder-container';
import { registerReminderRoutes } from './routes';
import type { ReminderUseCases } from '../controllers/reminder.controller';
import { registerReminderInitializationTasks } from './initialization';
import { ReminderTemplate } from '../domain-server/aggregates/reminder-template';
import { ReminderGroup } from '../domain-server/aggregates/reminder-group';
import { IdentityId } from '@dailyuse/domain-shared';

export interface ReminderApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface ReminderApiModuleDef {
  readonly name: string;
  register(context: ReminderApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const ReminderApiModule: ReminderApiModuleDef = {
  name: 'Reminder',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — initialize repositories via ReminderModule
    const reminderModule = new ReminderModule('prisma', db as PrismaClient);

    // 2. Wire route handlers directly to repositories
    const handlers: ReminderUseCases = {
      // Template CRUD
      createTemplate: async (data, ctx) => {
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
          identityId: IdentityId.of(ctx.identityId),
        });
        await reminderModule.reminderTemplateRepository.save(template);
        return ok(template.toClientDTO());
      },
      listTemplates: async (ctx) =>
        ok(await reminderModule.reminderTemplateRepository.findByIdentityId(ctx.identityId)),
      getUpcomingReminders: async (params, ctx) =>
        ok(
          await reminderModule.reminderTemplateRepository.findByNextTriggerBefore(
            params.beforeTime
              ? new Date(params.beforeTime as string | number).getTime()
              : Date.now(),
            ctx.identityId as any,
          ),
        ),
      getTemplate: async (id) => ok(await reminderModule.reminderTemplateRepository.findById(id)),
      updateTemplate: async (id, data) => {
        const existing = await reminderModule.reminderTemplateRepository.findById(id);
        if (!existing) throw new Error('Template not found');
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
        existing.update(normalizedUpdates as any);
        await reminderModule.reminderTemplateRepository.save(existing);
        return ok(existing.toClientDTO());
      },
      deleteTemplate: async (id) => {
        await reminderModule.reminderTemplateRepository.delete(id);
        return ok(undefined);
      },

      // Group CRUD
      createGroup: async (data, ctx) => {
        const group = ReminderGroup.create({
          ...data,
          identityId: ctx.identityId,
        });
        await reminderModule.reminderGroupRepository.save(group);
        return ok(group.toClientDTO());
      },
      listGroups: async (ctx) =>
        ok(await reminderModule.reminderGroupRepository.findByIdentityId(ctx.identityId)),
      getGroup: async (id) => ok(await reminderModule.reminderGroupRepository.findById(id)),
      updateGroup: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        // Reconstruct with updated fields via load()
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
        await reminderModule.reminderGroupRepository.save(updated);
        return ok(updated.toClientDTO());
      },
      deleteGroup: async (id) => {
        await reminderModule.reminderGroupRepository.delete(id);
        return ok(undefined);
      },
      switchGroupControlMode: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        if (data.mode === 'Group') {
          existing.switchToGroupControl();
        } else {
          existing.switchToIndividualControl();
        }
        await reminderModule.reminderGroupRepository.save(existing);
        return ok(existing.toClientDTO());
      },
      batchGroupTemplates: async (groupId, data) => {
        const templates = await reminderModule.reminderTemplateRepository.findByGroupId(groupId);
        let successCount = 0;
        for (const t of templates) {
          if (data.action === 'ENABLE') {
            t.enable();
          } else {
            t.pause();
          }
          await reminderModule.reminderTemplateRepository.save(t);
          successCount++;
        }
        return ok({ successCount, failedCount: 0 });
      },
    };

    // 3. Register routes
    const reminderRoutes = registerReminderRoutes(handlers, middleware, context.openApiRegistry);

    // 4. Mount sub-API routes
    router.use('/reminders', reminderRoutes);

    // 5. Register initialization tasks
    registerReminderInitializationTasks();
  },

  destroy() {
    ReminderContainer.getInstance().reset();
  },
};
