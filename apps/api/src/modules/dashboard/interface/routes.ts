/**
 * Dashboard Routes Aggregator
 * 聚合所有仪表板相关的 HTTP 路由
 *
 * 模块路由组织：
 * - /api/dashboard/widgets  - 小部件管理和配置
 * - /api/dashboard/layout   - 布局和预设管理
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerDashboardWidgetRoutes } from './dashboard-widget.routes';
import { registerDashboardLayoutRoutes } from './dashboard-layout.routes';

export function registerDashboardRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 仪表板小部件路由 ============
  router.use('/widgets', registerDashboardWidgetRoutes());

  // ============ 仪表板布局路由 ============
  router.use('/layout', registerDashboardLayoutRoutes());

  return router;
}
