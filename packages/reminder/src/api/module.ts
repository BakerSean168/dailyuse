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
import { ReminderModule } from '../infrastructure-server';
import { ReminderContainer } from '../infrastructure-server/di/reminder-container';
import { registerReminderRoutes } from './routes';
import type { ReminderRouteHandlers } from './routes';
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
    const handlers: ReminderRouteHandlers = {
      // Template CRUD
      createTemplate: (identityId, data) =>
        reminderModule.reminderTemplateRepository.save({ ...data, identityId }),
      listTemplates: (identityId) =>
        reminderModule.reminderTemplateRepository.findByIdentityId(identityId),
      getUpcomingReminders: (identityId, params) =>
        reminderModule.reminderTemplateRepository.findByNextTriggerBefore(
          params.beforeTime ? new Date(params.beforeTime).getTime() : Date.now(),
          identityId,
        ),
      getTemplate: (id) =>
        reminderModule.reminderTemplateRepository.findById(id),
      updateTemplate: async (id, data) => {
        const existing = await reminderModule.reminderTemplateRepository.findById(id);
        if (!existing) throw new Error('Template not found');
        return reminderModule.reminderTemplateRepository.save({ ...existing, ...data });
      },
      deleteTemplate: (id) =>
        reminderModule.reminderTemplateRepository.delete(id),

      // Group CRUD
      createGroup: (identityId, data) =>
        reminderModule.reminderGroupRepository.save({ ...data, identityId }),
      listGroups: (identityId) =>
        reminderModule.reminderGroupRepository.findByIdentityId(identityId),
      getGroup: (id) =>
        reminderModule.reminderGroupRepository.findById(id),
      updateGroup: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        return reminderModule.reminderGroupRepository.save({ ...existing, ...data });
      },
      deleteGroup: (id) =>
        reminderModule.reminderGroupRepository.delete(id),
      switchGroupControlMode: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        return reminderModule.reminderGroupRepository.save({ ...existing, ...data });
      },
      batchGroupTemplates: async (groupId, data) => {
        const templates = await reminderModule.reminderTemplateRepository.findByGroupId(groupId);
        const results = await Promise.all(
          templates.map((t) => reminderModule.reminderTemplateRepository.save({ ...t, ...data })),
        );
        return results;
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