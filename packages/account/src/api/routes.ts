/**
 * Account API Routes
 *
 * Uses expressAdapter to eliminate boilerplate code.
 *
 * Routes:
 *   GET    /me             — 获取当前用户资料
 *   PUT    /me             — 更新当前用户资料 (UpdateAccountSchema)
 *   POST   /availability   — 检查可用性 (CheckAvailabilitySchema)
 *   POST   /me/close       — 注销账户 (CloseAccountSchema)
 *   DELETE /me             — 注销账户（别名）
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { AccountController } from '../controllers/account.controller';
import type { AccountUseCases } from '../controllers/account.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerAccountRoutes(
  handlers: AccountUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new AccountController(handlers);

  // GET /me — 获取当前用户资料
  router.get('/me', auth, expressAdapter(
    (_req, ctx) => controller.getProfile(ctx),
  ));

  // PUT /me — 更新当前用户资料 (UpdateAccountSchema)
  router.put('/me', auth, expressAdapter(
    (req, ctx) => controller.updateProfile(req.body, ctx),
  ));

  // POST /availability — 检查可用性 (CheckAvailabilitySchema)
  router.post('/availability', auth, expressAdapter(
    (req) => controller.checkAvailability(req.body),
  ));

  // POST /me/close — 注销账户 (CloseAccountSchema)
  router.post('/me/close', auth, expressAdapter(
    (req, ctx) => controller.closeAccount(req.body, ctx),
  ));

  // DELETE /me — 注销账户（别名）
  router.delete('/me', auth, expressAdapter(
    (req, ctx) => controller.closeAccount(req.body, ctx),
  ));

  return router;
}
