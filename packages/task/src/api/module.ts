/**
 * Task API Module Definition
 *
 * Implements IApiModule standard interface, self-contained:
 * 1. Composition Root (creates Repo → Service → Controller)
 * 2. Route definition and mounting
 * 3. Initialization task registration
 *
 * Middleware from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import { prisma } from '@dailyuse/database';
import { TaskModule } from '../infrastructure-server/task.module';
import { TaskTemplateController } from './controllers/task-template.controller';
import { TaskInstanceController } from './controllers/task-instance.controller';
import { TaskStatsController } from './controllers/task-stats.controller';
import { registerTaskRoutes } from './routes';
import { registerTaskInitializationTasks } from './initialization';

/**
 * Module registration context (aligned with apps/api IApiModuleContext)
 *
 * Defined locally in task package to avoid circular dependency with apps/api.
 * TypeScript structural typing ensures compatibility as long as field signatures match.
 */
export interface TaskApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
}

export interface TaskApiModuleOptions {
  /** Custom route prefix (default '/tasks') */
  routePrefix?: string;
}

export interface TaskApiModuleDef {
  readonly name: string;
  register(context: TaskApiModuleContext): void;
  destroy?(): void;
}

export const TaskApiModule: TaskApiModuleDef = {
  name: 'Task',

  register(context) {
    const { router, middleware } = context;

    // 1. Composition Root — Assemble dependencies using TaskModule DI container
    const taskModule = new TaskModule('prisma', prisma);

    // 2. Create controllers with application services
    const templateController = new TaskTemplateController(
      taskModule.taskTemplateService,
    );
    const instanceController = new TaskInstanceController(
      taskModule.taskInstanceService,
    );
    const statsController = new TaskStatsController(
      taskModule.taskStatisticsService,
    );

    // 3. Register routes (inject platform middleware)
    registerTaskRoutes(
      {
        templateController,
        instanceController,
        statsController,
      },
      middleware,
      router,
    );

    // 4. Register initialization tasks (event handlers, background jobs)
    registerTaskInitializationTasks();
  },
};
