/**
 * Goal API Module Definition
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → Handler）
 * 2. 路由定义与挂载
 * 3. 初始化任务注册
 *
 * 遵循 Governance 模块的参考实现模式。
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  GoalPrismaRepository,
  GoalFolderPrismaRepository,
  GoalRecordPrismaRepository,
  GoalModule,
} from '../infrastructure-server';
import { GoalContainer } from '../infrastructure-server/di/goal-container';
import { registerGoalRoutes } from './routes';
import { registerGoalInitializationTasks } from './initialization';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';

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

export const GoalApiModule: GoalApiModuleDef = {
  name: 'Goal',

  register(context) {
    const { router, middleware, db } = context;

    // 1. 创建 Repository
    const prismaClient = db as PrismaClient;
    const goalRepository = new GoalPrismaRepository(prismaClient);
    const goalFolderRepository = new GoalFolderPrismaRepository(prismaClient);
    const goalRecordRepository = new GoalRecordPrismaRepository(prismaClient);

    // 2. 使用共享组合根创建 Use Cases / Services
    const goalModule = new GoalModule({
      goalRepository,
      goalFolderRepository,
      goalRecordRepository,
    });

    // 3. 创建 Handlers（函数引用）
    const handlers = {
      createGoal: goalModule.createGoal,
      getGoal: goalModule.getGoal,
      listGoals: goalModule.listGoals,
      updateGoal: goalModule.updateGoal,
      deleteGoal: goalModule.deleteGoal,
      archiveGoal: goalModule.archiveGoal,
      activateGoal: goalModule.activateGoal,
      searchGoals: goalModule.searchGoals,
      addKeyResult: goalModule.addKeyResult,
      updateKeyResult: goalModule.updateKeyResult,
      updateKeyResultProgress: goalModule.updateKeyResultProgress,
      deleteKeyResult: goalModule.deleteKeyResult,
      addReview: goalModule.addReview,
    };

    // 4. 注册路由（同时注册 OpenAPI 文档）
    const goalRoutes = registerGoalRoutes(handlers, middleware, context.openApiRegistry);
    router.use('/goals', goalRoutes);

    // 5. 注册初始化任务
    registerGoalInitializationTasks();
  },

  destroy() {
    GoalContainer.getInstance().reset();
  },
};
