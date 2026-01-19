/**
 * Task Routes Aggregator
 * 聚合所有任务相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';

// Task Instance Routes (聚合根和CRUD操作)
import { registerTaskInstanceStateRoutes } from './task-instance-state.routes';
import { registerTaskInstanceCrudRoutes } from './task-instance-crud.routes';

// Task Template Routes (模板管理)
import { registerTaskTemplateCrudRoutes } from './task-template-crud.routes';
import { registerTaskTemplateStateRoutes } from './task-template-state.routes';
import { registerTaskTemplateInstancesRoutes } from './task-template-instances.routes';
import { registerTaskTemplateGoalsRoutes } from './task-template-goals.routes';

// One-Time Tasks Routes (一次性任务)
import { registerTaskOnetimeRoutes } from './task-onetime.routes';
import { registerTaskQueriesRoutes } from './task-queries.routes';
import { registerTaskOperationsRoutes } from './task-operations.routes';
import { registerTaskSubtasksRoutes } from './task-subtasks.routes';
import { registerTaskBatchOperationsRoutes } from './task-batch-operations.routes';

// Common Routes (统计、依赖等)
import { registerTaskDependencyRoutes } from './task-dependency.routes';
import { registerTaskStatisticsRoutes } from './task-statistics.routes';

export function registerTaskRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 任务实例路由 ============
  // 聚合根操作（开始、完成、跳过）
  router.use('/', registerTaskInstanceStateRoutes());
  // 基本CRUD操作（列表、查询、删除）
  router.use('/', registerTaskInstanceCrudRoutes());

  // ============ 任务模板路由 ============
  // 模板CRUD操作
  router.use('/templates', registerTaskTemplateCrudRoutes());
  // 模板状态操作（激活、暂停、归档）
  router.use('/templates', registerTaskTemplateStateRoutes());
  // 模板实例生成和管理
  router.use('/templates', registerTaskTemplateInstancesRoutes());
  // 模板与目标绑定
  router.use('/templates', registerTaskTemplateGoalsRoutes());

  // ============ 一次性任务路由 ============
  // 基本操作（创建、列表、更新）
  router.use('/', registerTaskOnetimeRoutes());
  // 查询操作（日期范围、优先级、仪表板等）
  router.use('/', registerTaskQueriesRoutes());
  // 状态操作（开始、完成、阻塞、取消等）
  router.use('/', registerTaskOperationsRoutes());
  // 子任务管理
  router.use('/', registerTaskSubtasksRoutes());
  // 批量操作
  router.use('/', registerTaskBatchOperationsRoutes());

  // ============ 任务统计路由 ============
  router.use('/statistics', registerTaskStatisticsRoutes());

  // ============ 任务依赖路由 ============
  router.use('/', registerTaskDependencyRoutes());

  return router;
}
