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
import { ok } from '@dailyuse/contracts/result';
import { ScheduleModule, ScheduleContainer } from '../infrastructure-server';
import { registerScheduleRoutes } from './routes';
import type { ScheduleUseCases } from '../controllers/schedule.controller';
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
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
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
    const handlers: ScheduleUseCases = {
      createTask: async (data, ctx) => {
        const result = await scheduleModule.createScheduleTask.execute({
          name: data.name,
          sourceModule: data.sourceModule,
          sourceId: data.sourceEntityId,
          scheduleConfig: data.schedule as any,
          handlerType: data.sourceModule,
          description: data.description,
          retryPolicy: data.retryPolicy as any,
          enabled: data.enabled,
          identityId: ctx.identityId,
        });
        return ok(result);
      },
      listTasks: async (query, ctx) => {
        let tasks;
        if (query.status) {
          tasks = await scheduleModule.listScheduleTasksByStatus.execute(query.status as any);
        } else if (query.sourceModule && query.sourceEntityId) {
          tasks = await scheduleModule.listScheduleTasksBySource.execute(
            query.sourceModule as any,
            query.sourceEntityId as string,
          );
        } else {
          tasks = await scheduleModule.listScheduleTasksByAccount.execute(ctx.identityId);
        }
        return ok(tasks);
      },
      updateTask: async (id, data) => {
        const result = await scheduleModule.updateScheduleTask.execute({
          id,
          scheduleConfig: data.schedule as any,
          retryPolicy: data.retryPolicy as any,
          enabled: data.enabled,
          description: data.description,
        });
        return ok(result);
      },
      deleteTask: async (id) => ok(await scheduleModule.deleteScheduleTask.execute(id)),
      pauseTask: async (id) => ok(await scheduleModule.pauseScheduleTask.execute(id)),
      resumeTask: async (id) => ok(await scheduleModule.resumeScheduleTask.execute(id)),
      triggerTask: async (id) => ok(await scheduleModule.triggerScheduleTask.execute(id)),
      getTask: async (id) => ok(await scheduleModule.getScheduleTask.execute(id)),
    };

    // 3. Register routes
    const scheduleRoutes = registerScheduleRoutes(handlers, middleware, context.openApiRegistry);

    // 4. Mount onto API router
    router.use('/schedules', scheduleRoutes);

    // 5. Register initialization tasks (event handlers)
    registerScheduleInitializationTasks();
  },

  destroy() {
    ScheduleContainer.getInstance().reset();
  },
};