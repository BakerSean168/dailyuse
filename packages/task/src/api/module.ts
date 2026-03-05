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
import type { PrismaClient } from '@dailyuse/database';
import { TaskModule } from '../infrastructure-server/task.module';
import { TaskContainer } from '../infrastructure-server/di/task-container';
import { TaskTemplateController } from './controllers/task-template.controller';
import { TaskInstanceController } from './controllers/task-instance.controller';
import { TaskDependencyController } from './controllers/task-dependency.controller';
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
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
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
    const { router, middleware, db } = context;

    // 1. Composition Root — TaskModule assembles repositories and configures TaskContainer
    const taskModule = new TaskModule('prisma', db as PrismaClient);

    // 2. Create controllers with application services
    const templateController = new TaskTemplateController(
      {
        createTemplate: taskModule.createTaskTemplate,
        getTemplate: taskModule.getTaskTemplate,
        listTemplates: taskModule.listTaskTemplates,
        updateTemplate: taskModule.updateTaskTemplate,
        deleteTemplate: taskModule.deleteTaskTemplate,
        activateTemplate: taskModule.activateTaskTemplate,
        pauseTemplate: taskModule.pauseTaskTemplate,
        archiveTemplate: taskModule.archiveTaskTemplate,
        listByPriority: taskModule.listTaskTemplatesByPriority,
        generateInstances: taskModule.generateTaskInstances,
        bindToGoal: taskModule.bindTaskToGoal,
        unbindFromGoal: taskModule.unbindTaskFromGoal,
        listInstancesByTemplate: taskModule.listTaskInstancesByTemplate,
      },
    );
    const instanceController = new TaskInstanceController({
      getTaskInstance: taskModule.getTaskInstance,
      listByAccount: taskModule.listTaskInstancesByAccount,
      listByTemplate: taskModule.listTaskInstancesByTemplate,
      listByStatus: taskModule.listTaskInstancesByStatus,
      getByDateRange: taskModule.getTaskInstancesByDateRange,
      complete: taskModule.completeTaskInstance,
      skip: taskModule.skipTaskInstance,
      start: taskModule.startTaskInstance,
      deleteInstance: taskModule.deleteTaskInstance,
      checkExpired: taskModule.checkExpiredInstances,
    });
    const dependencyController = new TaskDependencyController({
      createDependency: taskModule.createTaskDependency,
      deleteDependency: taskModule.deleteTaskDependency,
      updateDependency: taskModule.updateTaskDependency,
      listDependencies: taskModule.listTaskDependencies,
      getDependencyChain: taskModule.getDependencyChain,
      validateDependency: taskModule.validateTaskDependency,
    });

    // 3. Register routes (inject platform middleware)
    registerTaskRoutes(
      {
        templateController,
        instanceController,
        dependencyController,
      },
      middleware,
      router,
      context.openApiRegistry,
    );

    // 4. Register initialization tasks (event handlers, background jobs)
    registerTaskInitializationTasks();
  },

  destroy() {
    TaskContainer.getInstance().reset();
  },
};
