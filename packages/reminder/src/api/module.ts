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

export interface ReminderApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
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
      createTemplate: async (data, ctx) =>
        ok(await reminderModule.reminderTemplateRepository.save({ ...data, identityId: ctx.identityId } as any)),
      listTemplates: async (ctx) =>
        ok(await reminderModule.reminderTemplateRepository.findByIdentityId(ctx.identityId)),
      getUpcomingReminders: async (params, ctx) =>
        ok(await reminderModule.reminderTemplateRepository.findByNextTriggerBefore(
          params.beforeTime ? new Date(params.beforeTime as string | number).getTime() : Date.now(),
          ctx.identityId as any,
        )),
      getTemplate: async (id) =>
        ok(await reminderModule.reminderTemplateRepository.findById(id)),
      updateTemplate: async (id, data) => {
        const existing = await reminderModule.reminderTemplateRepository.findById(id);
        if (!existing) throw new Error('Template not found');
        return ok(await reminderModule.reminderTemplateRepository.save({ ...existing, ...data } as any));
      },
      deleteTemplate: async (id) => {
        await reminderModule.reminderTemplateRepository.delete(id);
        return ok(undefined);
      },

      // Group CRUD
      createGroup: async (data, ctx) =>
        ok(await reminderModule.reminderGroupRepository.save({ ...data, identityId: ctx.identityId } as any)),
      listGroups: async (ctx) =>
        ok(await reminderModule.reminderGroupRepository.findByIdentityId(ctx.identityId)),
      getGroup: async (id) =>
        ok(await reminderModule.reminderGroupRepository.findById(id)),
      updateGroup: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        return ok(await reminderModule.reminderGroupRepository.save({ ...existing, ...data } as any));
      },
      deleteGroup: async (id) => {
        await reminderModule.reminderGroupRepository.delete(id);
        return ok(undefined);
      },
      switchGroupControlMode: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        return ok(await reminderModule.reminderGroupRepository.save({ ...existing, ...data } as any));
      },
      batchGroupTemplates: async (groupId, data) => {
        const templates = await reminderModule.reminderTemplateRepository.findByGroupId(groupId);
        const results = await Promise.all(
          templates.map((t) => reminderModule.reminderTemplateRepository.save({ ...t, ...data } as any)),
        );
        return ok(results);
      },
    };

    // 3. Register routes
    const reminderRoutes = registerReminderRoutes(handlers, middleware);

    // 4. Mount sub-API routes
    router.use('/reminders', reminderRoutes);

    // 5. Register initialization tasks
    registerReminderInitializationTasks();
  },

  destroy() {
    ReminderContainer.getInstance().reset();
  },
};