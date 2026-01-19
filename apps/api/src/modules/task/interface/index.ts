/**
 * Task Routes Aggregator
 * 聚合所有任务相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerTaskTemplateRoutes } from './task-template.routes';
import { registerTaskDependencyRoutes } from './task-dependency.routes';
import { registerTaskStatisticsRoutes } from './task-statistics.routes';
import { registerTaskInstanceRoutes } from './task-instance.routes';

export function registerTaskRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 任务实例路由 ============
  // 一次性任务和任务实例的所有操作
  router.use('/', registerTaskInstanceRoutes());

  // ============ 任务模板路由 ============
  // 用于 RECURRING 任务模板
  router.use('/templates', registerTaskTemplateRoutes());

  // ============ 任务统计路由 ============
  // 任务统计数据
  router.use('/statistics', registerTaskStatisticsRoutes());

  // ============ 任务依赖路由 ============
  // 任务依赖关系管理
  router.use('/', registerTaskDependencyRoutes());

  return router;
}
