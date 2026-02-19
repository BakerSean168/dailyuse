/**
 * Schedule API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (ScheduleModule → UseCases → Handlers)
 * 2. Route definition and mounting
 * 3. Initialization task registration
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { Express, RequestHandler } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { ScheduleModule, ScheduleContainer } from '../infrastructure-server';
import { registerScheduleRoutes } from './routes';
import type { ScheduleRouteHandlers } from './routes';
import { registerScheduleInitializationTasks } from './initialization';

/**
 * Module context (structurally compatible with IApiModuleContext from apps/api).
 * Locally defined to avoid circular dependency on apps/api.
 */
export interface ScheduleApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface ScheduleApiModuleDef {
  readonly name: string;
  register(context: ScheduleApiModuleContext): void;
  destroy?(): void;
}

export const ScheduleApiModule: ScheduleApiModuleDef = {
  name: 'Schedule',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — create module with shared database client
    const scheduleModule = new ScheduleModule('prisma', db as PrismaClient);

    // 2. Build handler map
    const handlers: ScheduleRouteHandlers = {
      createTask: (data) => scheduleModule.createScheduleTask.execute(data),
      updateTask: (data) => scheduleModule.updateScheduleTask.execute(data),
      deleteTask: (id) => scheduleModule.deleteScheduleTask.execute(id),
      pauseTask: (id) => scheduleModule.pauseScheduleTask.execute(id),
      resumeTask: (id) => scheduleModule.resumeScheduleTask.execute(id),
      triggerTask: (id) => scheduleModule.triggerScheduleTask.execute(id),
      getTask: (id) => scheduleModule.getScheduleTask.execute(id),
      listTasksByAccount: (identityId) => scheduleModule.listScheduleTasksByAccount.execute(identityId),
      listTasksBySource: (sourceModule, sourceEntityId) =>
        scheduleModule.listScheduleTasksBySource.execute(sourceModule as any, sourceEntityId),
      listTasksByStatus: (status) =>
        scheduleModule.listScheduleTasksByStatus.execute(status as any),
    };

    // 3. Register routes
    const scheduleRoutes = registerScheduleRoutes(handlers, middleware);

    // 4. Mount onto API router
    router.use('/schedules', scheduleRoutes);

    // 5. Register initialization tasks (event handlers)
    registerScheduleInitializationTasks();
  },

  destroy() {
    ScheduleContainer.getInstance().reset();
  },
};