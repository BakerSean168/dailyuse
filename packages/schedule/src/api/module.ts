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
import { ok, fail } from '@dailyuse/contracts/result';
import { ScheduleModule, ScheduleContainer } from '../infrastructure-server';
import { ScheduleConflictDetectionService } from '../application-server/services/schedule-conflict-detection-service';
import { registerScheduleRoutes } from './routes';
import { registerScheduleEventRoutes } from './schedule-event.routes';
import { ScheduleEventController } from '../controllers/schedule-event.controller';
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

      completeTask: async (id) => {
        const task = await scheduleModule.scheduleTaskRepository.findById(id as any);
        if (!task) return fail({ code: 'NOT_FOUND', message: '任务不存在' });
        task.complete();
        await scheduleModule.scheduleTaskRepository.save(task);
        return ok(task.toServerDTO());
      },
      cancelTask: async (id, reason) => {
        const task = await scheduleModule.scheduleTaskRepository.findById(id as any);
        if (!task) return fail({ code: 'NOT_FOUND', message: '任务不存在' });
        task.cancel(reason);
        await scheduleModule.scheduleTaskRepository.save(task);
        return ok(task.toServerDTO());
      },
      getDueTasks: async () => {
        const tasks = await scheduleModule.scheduleTaskRepository.findDueTasksForExecution(new Date());
        return ok(tasks.map((t: any) => t.toServerDTO()));
      },
      batchDeleteTasks: async (ids) => {
        const results = { success: [] as string[], failed: [] as { id: string; error: string }[] };
        for (const id of ids) {
          try {
            await scheduleModule.deleteScheduleTask.execute(id);
            results.success.push(id);
          } catch (err) {
            results.failed.push({ id, error: err instanceof Error ? err.message : 'Unknown error' });
          }
        }
        return ok(results);
      },
      updateTaskMetadata: async (id, metadata) => {
        const task = await scheduleModule.scheduleTaskRepository.findById(id as any);
        if (!task) return fail({ code: 'NOT_FOUND', message: '任务不存在' });
        task.updateMetadata(metadata);
        await scheduleModule.scheduleTaskRepository.save(task);
        return ok(task.toServerDTO());
      },
    };

    // 3. Register routes
    const scheduleRoutes = registerScheduleRoutes(handlers, middleware, context.openApiRegistry);

    // 3b. Register schedule event routes (calendar entries)
    const conflictDetectionService = new ScheduleConflictDetectionService(scheduleModule.scheduleRepository);
    const eventController = new ScheduleEventController({
      scheduleEventService: scheduleModule.scheduleEventService,
      conflictDetectionService,
    });
    const eventRoutes = registerScheduleEventRoutes(eventController, middleware, context.openApiRegistry);

    // 4. Mount onto API router
    router.use('/schedules', scheduleRoutes);
    router.use('/schedules/events', eventRoutes);

    // 5. Register initialization tasks (event handlers)
    registerScheduleInitializationTasks();
  },

  destroy() {
    ScheduleContainer.getInstance().reset();
  },
};