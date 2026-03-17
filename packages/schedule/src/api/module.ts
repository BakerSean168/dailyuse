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

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  createScheduleModule,
  createScheduleUseCases,
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
import { createScheduleRuntimeContribution } from './runtime';

/**
 * Module context (structurally compatible with IApiModuleContext from apps/api).
 * 模块注册上下文（与 apps/api 的 IApiModuleContext 结构类型兼容）。
 *
 * Locally defined to avoid circular dependency on apps/api.
 * 此类型在 schedule 包内本地定义，避免对 apps/api 的循环依赖。
 */
export interface ScheduleApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface ScheduleApiModuleDef {
  readonly name: string;
  register(context: ScheduleApiModuleContext): void;
  destroy?(): void;
}

let activeScheduleModule: ScheduleModuleInstance | null = null;

export const ScheduleApiModule: ScheduleApiModuleDef = {
  name: 'Schedule',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — assemble dependencies (use shared database singleton)
    // 1. 组合根 —— 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;

    // Build repositories first.
    // 先构建仓储实例。
    const repos = {
      scheduleRepository: new SchedulePrismaRepository(prismaClient),
      scheduleExecutionRepository: new ScheduleExecutionPrismaRepository(prismaClient),
      scheduleTaskRepository: new ScheduleTaskPrismaRepository(prismaClient),
    };

    // Build use cases independently to break the chicken-and-egg cycle:
    // the runtime contribution needs use case references, but the module
    // constructor needs the runtime contribution.
    // 先独立构建 use case 以打破循环依赖：
    // 运行时贡献需要 use case 引用，而模块构造器需要运行时贡献。
    const useCases = createScheduleUseCases(repos);

    // Create the runtime contribution with the pre-built use cases.
    // 用预先构建的 use case 创建运行时贡献。
    const runtimeContribution = createScheduleRuntimeContribution({
      createScheduleTask: useCases.createScheduleTask,
      listScheduleTasksBySource: useCases.listScheduleTasksBySource,
      deleteScheduleTask: useCases.deleteScheduleTask,
      pauseScheduleTask: useCases.pauseScheduleTask,
      resumeScheduleTask: useCases.resumeScheduleTask,
    });

    // Now assemble the module with both repos and runtime contribution.
    // createScheduleModule will build its own use cases internally — the
    // pre-built set above is only for the runtime contribution wiring.
    // 现在用仓储和运行时贡献组装模块。
    // createScheduleModule 内部会再构建一份 use case — 上面预构建的
    // 仅用于运行时贡献接线。
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
