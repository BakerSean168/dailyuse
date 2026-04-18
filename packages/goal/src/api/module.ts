/**
 * Goal API Module Definition
 * 目标模块 API 定义
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → Handler）
 * 2. 路由定义与挂载
 * 3. 运行时贡献注册
 *
 * 遵循 Governance 模块的参考实现模式。
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  createGoalPrismaModule,
  GoalPrismaRepository,
  type GoalModuleInstance,
} from '../infrastructure-server';
import { registerGoalRoutes, registerGoalFolderRoutes_ } from './routes/index';
import {
  createGoalTransportHandlers,
  createGoalFolderTransportHandlers,
} from './transport-handlers';
import { createGoalRuntimeContribution } from './runtime';
import { createGoalScheduleRuntimeContribution } from './schedule-runtime';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { ScheduleTaskPrismaRepository } from '@dailyuse/schedule/infrastructure-server';

/**
 * 模块注册上下文（与 apps/api 的 IApiModuleContext 对齐）
 *
 * 此类型在 goal 包内本地定义，避免对 apps/api 的循环依赖。
 * 只要字段签名一致，TypeScript 结构类型系统会自动兼容。
 */
export interface GoalApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: OpenApiRegistryLike;
}

export interface GoalApiModuleDef {
  readonly name: string;
  register(context: GoalApiModuleContext): void;
  destroy?(): void;
}

let activeGoalModule: GoalModuleInstance | null = null;

export const GoalApiModule: GoalApiModuleDef = {
  name: 'Goal',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;
    const goalRepository = new GoalPrismaRepository(prismaClient);
    const goalModule = createGoalPrismaModule(prismaClient, {
      runtimeContributions: [
        createGoalRuntimeContribution(),
        createGoalScheduleRuntimeContribution({
          goalRepository,
          scheduleTaskRepository: new ScheduleTaskPrismaRepository(prismaClient),
        }),
      ],
    });
    activeGoalModule = goalModule;
    goalModule.start();

    // 2. Transport handlers (thin mapping from api port to controller ports)
    // 传输层处理器（从 api 端口到控制器端口的薄映射）
    const goalHandlers = createGoalTransportHandlers(goalModule.api);
    const folderHandlers = createGoalFolderTransportHandlers(goalModule.api);

    // 3. 创建路由并挂载（注入平台中间件，同时注册 OpenAPI 文档）
    const goalRoutes = registerGoalRoutes(goalHandlers, middleware, context.openApiRegistry);
    router.use('/goals', goalRoutes);

    const folderRoutes = registerGoalFolderRoutes_(
      folderHandlers,
      middleware,
      context.openApiRegistry,
    );
    router.use('/goal-folders', folderRoutes);
  },

  destroy() {
    activeGoalModule?.dispose();
    activeGoalModule = null;
  },
};
