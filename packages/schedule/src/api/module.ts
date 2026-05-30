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

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createScheduleModule,
  SchedulePrismaRepository,
  ScheduleTaskPrismaRepository,
  ScheduleExecutionPrismaRepository,
  type ScheduleModuleInstance,
} from '../infrastructure-server';
import { ScheduleEventController } from '../controllers/schedule-event.controller';
import { registerScheduleRoutes } from './routes';
import { registerScheduleEventRoutes } from './schedule-event.routes';
import {
  createScheduleEventTransportHandlers,
  createScheduleTransportHandlers,
} from './transport-handlers';
import { createScheduleRuntimeContribution, type ScheduleTaskSourceExecutor } from './runtime';

/**
 * Typed module context for schedule registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type ScheduleApiModuleContext = ServerModuleContext<PrismaClient>;

export interface ScheduleApiModuleDef {
  readonly name: string;
  register(context: ScheduleApiModuleContext): void;
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

    register(context) {
      const { router, middleware, db } = context;

      // 1. Composition Root — assemble dependencies (use shared database singleton)
      // 1. 组合根 —— 组装依赖（使用共享数据库单例）
      const prismaClient = db;

      const repos = {
        scheduleRepository: new SchedulePrismaRepository(prismaClient),
        scheduleExecutionRepository: new ScheduleExecutionPrismaRepository(prismaClient),
        scheduleTaskRepository: new ScheduleTaskPrismaRepository(prismaClient),
      };

      const runtimeContribution = createScheduleRuntimeContribution({
        scheduleTaskRepository: repos.scheduleTaskRepository,
        sourceExecutor:
          options.sourceExecutor ??
          {
            async execute(task) {
              throw new Error(`No schedule source executor configured for ${task.sourceModule}`);
            },
          },
      });

      const scheduleModule = createScheduleModule({
        ...repos,
        runtimeContributions: runtimeContribution,
      });
      activeScheduleModule = scheduleModule;
      scheduleModule.start();

      // 2. Transport handlers (thin boring mapping)
      // 2. 传输层处理器（简单透传映射）
      const handlers = createScheduleTransportHandlers(scheduleModule.api);

      // 3. Register task routes / 注册任务路由
      const scheduleRoutes = registerScheduleRoutes(handlers, middleware, context.openApiRegistry);

      // 3b. Register schedule event routes (calendar entries)
      // 3b. 注册日程事件路由（日历条目）
      const eventController = new ScheduleEventController({
        ...createScheduleEventTransportHandlers(scheduleModule.eventApi),
      });
      const eventRoutes = registerScheduleEventRoutes(
        eventController,
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
