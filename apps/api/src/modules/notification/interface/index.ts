/**
 * Notification Routes Aggregator
 * 聚合所有通知相关的 HTTP 路由
 *
 * 模块化设计 - 按用例拆分:
 * - Core: 通知基础 CRUD 和读取状态
 * - Channel: 通知渠道配置（Email, SMS, Push, In-App）
 * - Template: 通知模板管理
 * - SSE: Server-Sent Events 实时通知推送
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerNotificationCoreRoutes } from './notification-core.routes';
import { registerNotificationChannelRoutes } from './notification-channel.routes';
import { registerNotificationTemplateRoutes } from './notification-template.routes';
import { registerSSERoutes } from './sseRoutes';
import {
  NotificationApplicationService,
  NotificationTemplateApplicationService,
  NotificationChannelApplicationService,
} from '@dailyuse/application-server';

export function registerNotificationRoutes(
  notificationService: NotificationApplicationService,
  channelService: NotificationChannelApplicationService,
  templateService: NotificationTemplateApplicationService,
): Router {
  const router: Router = ExpressRouter();

  // ============ 通知核心路由 ============
  // POST   /api/notifications              - 创建通知
  // GET    /api/notifications              - 获取列表
  // GET    /api/notifications/:id          - 获取详情
  // PUT    /api/notifications/:id          - 更新通知
  // DELETE /api/notifications/:id          - 删除通知
  // PATCH  /api/notifications/:id/read     - 标记已读
  // POST   /api/notifications/batch/read   - 批量标记已读
  router.use('/', registerNotificationCoreRoutes(notificationService));

  // ============ 通知渠道配置路由 ============
  // GET    /api/notifications/channels              - 获取所有渠道
  // GET    /api/notifications/channels/:type        - 获取渠道配置
  // PUT    /api/notifications/channels/:type        - 更新渠道
  // PATCH  /api/notifications/channels/:type/enable - 启用渠道
  // PATCH  /api/notifications/channels/:type/disable - 禁用渠道
  // POST   /api/notifications/channels/:type/verify - 验证渠道
  router.use('/channels', registerNotificationChannelRoutes(channelService));

  // ============ 通知模板管理路由 ============
  // POST   /api/notifications/templates           - 创建模板
  // GET    /api/notifications/templates           - 获取列表
  // GET    /api/notifications/templates/:id       - 获取详情
  // PUT    /api/notifications/templates/:id       - 更新模板
  // DELETE /api/notifications/templates/:id       - 删除模板
  // POST   /api/notifications/templates/:id/preview - 预览模板
  router.use('/templates', registerNotificationTemplateRoutes(templateService));

  // ============ 通知 SSE 路由 ============
  // 实时推送通知流
  router.use('/sse', registerSSERoutes());

  return router;
}
