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

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createGoalPrismaModule,
  type GoalModuleInstance,
} from '../server/infrastructure';
import { registerGoalRoutes, registerGoalFolderRoutes } from './routes/index';
import {
  createGoalTransportHandlers,
  createGoalFolderTransportHandlers,
} from '../server/transport';
import { createGoalRuntimeContribution } from '../server/infrastructure/runtime';

/**
 * Typed module context for goal registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type GoalApiModuleContext = ServerModuleContext<PrismaClient>;

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

    // 1. Composition Root — 组装依赖
    const goalModule = createGoalPrismaModule(db, {
      runtimeContributions: [createGoalRuntimeContribution()],
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

    const folderRoutes = registerGoalFolderRoutes(
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
