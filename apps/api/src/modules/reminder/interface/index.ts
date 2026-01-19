/**
 * Reminder Routes Aggregator
 * 聚合所有提醒相关的 HTTP 路由
 *
 * 模块化设计 - 按用例拆分:
 * - Core: 基础 CRUD 操作
 * - Template: 模板管理
 * - Group: 分组管理
 * - Execution: 执行历史和状态
 * - Search: 搜索和分析
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerReminderCoreRoutes } from './reminder-core.routes';
import { registerReminderTemplateRoutes } from './reminder-template.routes';
import { registerReminderGroupRoutes } from './reminder-group.routes';
import { registerReminderExecutionRoutes } from './reminder-execution.routes';
import { registerReminderSearchAnalyticsRoutes } from './reminder-search.routes';

export function registerReminderRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 核心提醒路由 ============
  // POST   /api/reminders           - 创建提醒
  // GET    /api/reminders           - 获取提醒列表
  // GET    /api/reminders/:uuid     - 获取提醒详情
  // PUT    /api/reminders/:uuid     - 更新提醒
  // DELETE /api/reminders/:uuid     - 删除提醒
  // PATCH  /api/reminders/:uuid/enable  - 启用
  // PATCH  /api/reminders/:uuid/disable - 禁用
  router.use('/', registerReminderCoreRoutes());

  // ============ 提醒模板路由 ============
  // POST   /api/reminders/templates       - 创建模板
  // GET    /api/reminders/templates       - 获取模板列表
  // GET    /api/reminders/templates/:uuid - 获取模板详情
  // PUT    /api/reminders/templates/:uuid - 更新模板
  // DELETE /api/reminders/templates/:uuid - 删除模板
  router.use('/templates', registerReminderTemplateRoutes());

  // ============ 提醒分组路由 ============
  // POST   /api/reminders/groups                           - 创建分组
  // GET    /api/reminders/groups                           - 获取分组列表
  // GET    /api/reminders/groups/:uuid                     - 获取分组详情
  // PUT    /api/reminders/groups/:uuid                     - 更新分组
  // DELETE /api/reminders/groups/:uuid                     - 删除分组
  // POST   /api/reminders/groups/:uuid/reminders           - 添加提醒到分组
  // DELETE /api/reminders/groups/:uuid/reminders/:reminderId - 移除提醒
  router.use('/groups', registerReminderGroupRoutes());

  // ============ 提醒执行路由 ============
  // GET    /api/reminders/executions       - 获取执行历史
  // POST   /api/reminders/executions       - 手动触发提醒
  // GET    /api/reminders/executions/:uuid - 获取执行详情
  // PUT    /api/reminders/executions/:uuid/status - 更新执行状态
  router.use('/executions', registerReminderExecutionRoutes());

  // ============ 提醒搜索和分析路由 ============
  // GET    /api/reminders/search/query            - 搜索提醒
  // GET    /api/reminders/analytics/statistics    - 获取统计数据
  // GET    /api/reminders/analytics/upcoming      - 即将到来的提醒
  // GET    /api/reminders/analytics/missed        - 错过的提醒
  router.use('/', registerReminderSearchAnalyticsRoutes());

  return router;
}
