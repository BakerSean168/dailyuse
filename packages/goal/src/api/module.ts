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

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
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
import { registerGoalEventListeners } from '../server/application/event-handlers';

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
let goalEventListeners: { start(): void; stop(): void } | null = null;

export function createGoalApiModule(options: {
  /** W0 GoalDependencyReadPort implementation provided by the host (Task package adapter). */
  taskBindingReadPort: import('@memoflow/contracts/reliable-messaging').GoalDependencyReadPort;
}): GoalApiModuleDef {
  if (!options?.taskBindingReadPort) {
    throw new Error('[FAIL-CLOSED] createGoalApiModule requires options.taskBindingReadPort');
  }
  return {
    name: 'Goal',

    register(context) {
      const { router, middleware, db } = context;

      // 1. Composition Root — 组装依赖
      const goalModule = createGoalPrismaModule(db, {
        runtimeContributions: [createGoalRuntimeContribution()],
        taskBindingReadPort: options.taskBindingReadPort,
      });
    activeGoalModule = goalModule;
    goalModule.start();

    // Cross-module reaction: task 完成 → 更新关联 KR 进度（ADR-033 范式 A）。
    // 与 apps/desktop 挂载同一份 registerGoalEventListeners，web 端由此获得同款能力。
    goalEventListeners = registerGoalEventListeners(
      goalModule.goalRepository,
      goalModule.goalRecordRepository,
      goalModule.goalWriteTransactionRunner,
    );
    goalEventListeners.start();

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
      goalEventListeners?.stop();
      goalEventListeners = null;
      activeGoalModule?.dispose();
      activeGoalModule = null;
    },
  };
}
