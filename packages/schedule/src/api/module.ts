/**
 * Schedule API Module Definition
 * 调度 API 模块定义
 *
 * Implements IApiModule standard interface, self-contained 3-step pattern:
 * 实现 IApiModule 标准接口，内部自治完成三步模式：
 * 1. Composition Root（创建 Repo → UseCase → Handler）
 * 2. Route definition and mounting / 路由定义与挂载
 * 3. Runtime contribution registration / 运行时贡献注册
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import {
  createSchedulePrismaModule,
  createScheduleTaskPrismaRepository,
  createScheduleRuntimeContribution,
  type ScheduleModuleInstance,
} from '../server/infrastructure';
import { registerScheduleRoutes } from './routes';
import { registerScheduleEventRoutes } from './schedule-event.routes';
import type { ScheduleTaskSourceExecutor } from '../server/application';

/**
 * Typed module context for schedule registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type ScheduleApiModuleContext = ServerModuleContext<PrismaClient>;

export interface ScheduleApiModuleDef {
  readonly name: string;
  register(context: ScheduleApiModuleContext): Promise<void> | void;
  destroy?(): void;
}

let activeScheduleModule: ScheduleModuleInstance | null = null;

export interface CreateScheduleApiModuleOptions {
  readonly sourceExecutor?: ScheduleTaskSourceExecutor;
}

export function createScheduleApiModule(
  options: CreateScheduleApiModuleOptions = {},
): ScheduleApiModuleDef {
  return {
    name: 'Schedule',

    async register(context) {
      const { router, middleware, db } = context;

      const runtimeContribution = createScheduleRuntimeContribution({
        scheduleTaskRepository: createScheduleTaskPrismaRepository(db),
        sourceExecutor:
          options.sourceExecutor ??
          {
            async execute(task) {
              throw new Error(`No schedule source executor configured for ${task.sourceModule}`);
            },
          },
      });

      const scheduleModule = createSchedulePrismaModule(db, {
        runtimeContributions: runtimeContribution,
      });
      activeScheduleModule = scheduleModule;
      await scheduleModule.start();

      // 3. Register task routes / 注册任务路由
      const scheduleRoutes = registerScheduleRoutes(
        scheduleModule.api,
        middleware,
        context.openApiRegistry,
      );

      // 3b. Register schedule event routes (calendar entries)
      // 3b. 注册日程事件路由（日历条目）
      const eventRoutes = registerScheduleEventRoutes(
        scheduleModule.eventApi,
        middleware,
        context.openApiRegistry,
      );

      // 4. Mount onto API router / 挂载到主路由
      router.use('/schedules', scheduleRoutes);
      router.use('/schedules/events', eventRoutes);
    },

    destroy() {
      activeScheduleModule?.dispose();
      activeScheduleModule = null;
    },
  };
}

export const ScheduleApiModule: ScheduleApiModuleDef = createScheduleApiModule();
