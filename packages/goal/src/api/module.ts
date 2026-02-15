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
import { prisma } from '@dailyuse/database';
import {
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ActivateGoal,
  SearchGoals,
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  AddGoalReview,
} from '../application-server';
import { GoalPolicy } from '../domain-server';
import { GoalPrismaRepository } from '../infrastructure-server';
import { registerGoalRoutes } from './routes';
import { registerGoalInitializationTasks } from './initialization';

export interface GoalApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
}

export interface GoalApiModuleDef {
  readonly name: string;
  register(context: GoalApiModuleContext): void;
  destroy?(): void;
}

export const GoalApiModule: GoalApiModuleDef = {
  name: 'Goal',

  register(context) {
    const { router, middleware } = context;

    // 1. 创建 Repository
    const goalRepository = new GoalPrismaRepository(prisma);

    // 2. 创建 Use Cases / Services
    const goalPolicy = new GoalPolicy();

    const createGoal = new CreateGoal(goalRepository, goalPolicy);
    const getGoal = new GetGoal(goalRepository);
    const listGoals = new ListGoals(goalRepository);
    const updateGoal = new UpdateGoal(goalRepository, goalPolicy);
    const deleteGoal = new DeleteGoal(goalRepository, goalPolicy);
    const archiveGoal = new ArchiveGoal(goalRepository, goalPolicy);
    const activateGoal = new ActivateGoal(goalRepository, goalPolicy);
    const searchGoals = new SearchGoals(goalRepository);
    const addKeyResult = new AddGoalKeyResult(goalRepository, goalPolicy);
    const updateKeyResult = new UpdateGoalKeyResult(goalRepository, goalPolicy);
    const updateKeyResultProgress = new UpdateGoalKeyResultProgress(goalRepository, goalPolicy);
    const deleteKeyResult = new DeleteGoalKeyResult(goalRepository, goalPolicy);
    const addReview = new AddGoalReview(goalRepository, goalPolicy);

    // 3. 创建 Handlers（函数引用）
    const handlers = {
      createGoal,
      getGoal,
      listGoals,
      updateGoal,
      deleteGoal,
      archiveGoal,
      activateGoal,
      searchGoals,
      addKeyResult,
      updateKeyResult,
      updateKeyResultProgress,
      deleteKeyResult,
      addReview,
    };

    // 4. 注册路由
    const goalRoutes = registerGoalRoutes(handlers, middleware);
    router.use('/goals', goalRoutes);

    // 5. 注册初始化任务
    registerGoalInitializationTasks();
  },
};
