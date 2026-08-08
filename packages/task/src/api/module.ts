/**
 * Task API Module Definition
 * 任务 API 模块定义
 *
 * Implements IApiModule standard interface, self-contained:
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root (creates Repo -> UseCase -> Handler)
 *    组合根（创建 Repo → UseCase → Handler）
 * 2. Route definition and mounting
 *    路由定义与挂载
 * 3. Runtime contribution lifecycle
 *    运行时贡献生命周期
 *
 * Middleware from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import {
  createTaskPrismaModule,
  createTaskRuntimeContribution,
  createTaskGoalOutboxRuntime,
  PrismaTaskGoalOutboxDispatchStore,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
} from '../server/infrastructure';
import {
  TaskGoalOutboxDispatcher,
  type TaskGoalProgressHandler,
} from '../server/application/outbox';
import { TaskTemplateController } from '../server/transport/task-template.controller';
import { TaskInstanceController } from '../server/transport/task-instance.controller';
import { TaskDependencyController } from '../server/transport/task-dependency.controller';
import { registerTaskRoutes } from './routes';
import { createTaskTransportHandlers } from '../server/transport';
// Residual 987: sole runtime-contribution normalize helpers (local dual retired).
import { normalizeRuntimeContributions } from '../server/infrastructure/normalize-runtime-contributions';

/**
 * Typed module context for task registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type TaskApiModuleContext = ServerModuleContext<PrismaClient>;

export interface TaskApiModuleOptions {
  /** Custom route prefix (default '/tasks'). 自定义路由前缀（默认 '/tasks'）。 */
  routePrefix?: string;
  readonly runtimeContributions?:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[];
  readonly goalProgressHandler?: TaskGoalProgressHandler;
}

export interface TaskApiModuleDef {
  readonly name: string;
  register(context: TaskApiModuleContext): Promise<void>;
  destroy?(): Promise<void>;
}

let activeTaskModule: TaskModuleInstance | null = null;

export function createTaskApiModule(
  options: TaskApiModuleOptions = {},
): TaskApiModuleDef {
  return {
    name: 'Task',

    async register(context) {
      const { router, middleware, db } = context;

      const taskModule = createTaskPrismaModule(db, {
        runtimeContributions: [
          createTaskRuntimeContribution(),
          ...(options.goalProgressHandler
            ? [
                createTaskGoalOutboxRuntime(
                  new TaskGoalOutboxDispatcher(
                    new PrismaTaskGoalOutboxDispatchStore(db),
                    options.goalProgressHandler,
                  ),
                ),
              ]
            : []),
          ...normalizeRuntimeContributions(options.runtimeContributions),
        ],
      });
      activeTaskModule = taskModule;
      await taskModule.start();

      // 2. Create transport handlers then controllers
      //    创建传输层处理器然后创建控制器
      const handlers = createTaskTransportHandlers(taskModule.api);

      const templateController = new TaskTemplateController(handlers.template);
      const instanceController = new TaskInstanceController(handlers.instance);
      const dependencyController = new TaskDependencyController(handlers.dependency);

      // 3. Register routes (inject platform middleware)
      //    注册路由（注入平台中间件）
      const taskRoutes = registerTaskRoutes(
        {
          templateController,
          instanceController,
          dependencyController,
        },
        middleware,
        context.openApiRegistry,
      );

      router.use(taskRoutes);
    },

    async destroy() {
      await activeTaskModule?.dispose();
      activeTaskModule = null;
    },
  };
}

export const TaskApiModule: TaskApiModuleDef = createTaskApiModule();
