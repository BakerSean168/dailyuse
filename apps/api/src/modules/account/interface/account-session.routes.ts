/**
 * Account Session Routes
 * 处理账户会话相关的 HTTP 路由
 *
 * 端点:
 * - GET    /accounts/me/sessions                  - 获取当前用户活跃会话
 * - DELETE /accounts/me/sessions/:sessionUuid     - 撤销特定会话
 * - POST   /accounts/me/sessions/revoke-others    - 撤销所有其他设备会话
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { createResponseBuilder } from '@dailyuse/contracts/response';

const responseBuilder = createResponseBuilder();

export function registerSessionRoutes(): Router {
  const router: Router = ExpressRouter();

  // ROUTE DISABLED PENDING AUTH MODULE REFACTOR
  
  return router;
}
