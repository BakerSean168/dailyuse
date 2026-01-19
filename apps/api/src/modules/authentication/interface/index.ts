/**
 * Authentication HTTP Routes
 * 聚合所有 Authentication 模块的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerLoginRoutes } from './authentication-login.routes';
import { registerSessionRoutes } from './authentication-session.routes';
import { registerTwoFactorRoutes } from './authentication-2fa.routes';
import { registerApiKeyRoutes } from './authentication-apikey.routes';
import { registerPasswordRoutes } from './authentication-password.routes';

/**
 * 注册 Authentication 所有路由
 *
 * 用法:
 *   import { registerAuthenticationRoutes } from './modules/authentication/interface/http';
 *   api.use('/auth', registerAuthenticationRoutes());
 */
export function registerAuthenticationRoutes(): Router {
  const router: Router = ExpressRouter();

  // 组合所有功能路由
  router.use('/', registerLoginRoutes());
  router.use('/', registerSessionRoutes());
  router.use('/', registerTwoFactorRoutes());
  router.use('/', registerApiKeyRoutes());
  router.use('/', registerPasswordRoutes());

  return router;
}

export default registerAuthenticationRoutes();
