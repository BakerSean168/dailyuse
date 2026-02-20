/**
 * Authentication API Routes
 *
 * Uses expressAdapter to eliminate boilerplate code.
 * Context extraction is handled by the adapter's defaultExtractContext.
 *
 * Routes:
 *   POST   /register   — 用户注册 (RegisterByEmailSchema)
 *   POST   /login      — 用户登录 (LoginByEmailSchema)
 *   POST   /logout     — 用户登出
 *   POST   /refresh    — 刷新访问令牌 (RefreshTokenSchema)
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { AuthenticationController } from '../controllers/auth.controller';
import type { AuthenticationUseCases } from '../controllers/auth.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerAuthenticationRoutes(
  handlers: AuthenticationUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new AuthenticationController(handlers);

  // POST /register — 用户注册 (no auth required)
  // ctx.identityId will be '' for unauthenticated routes; deviceId auto-extracted
  router.post('/register', expressAdapter(
    (req, ctx) => controller.register(req.body, ctx),
    { requireAuth: false, successStatus: 201 },
  ));

  // POST /login — 用户登录 (no auth required)
  router.post('/login', expressAdapter(
    (req, ctx) => controller.login(req.body, ctx),
    { requireAuth: false },
  ));

  // POST /logout — 用户登出
  router.post('/logout', auth, expressAdapter(
    (req, ctx) => controller.logout(ctx),
  ));

  // POST /refresh — 刷新访问令牌
  router.post('/refresh', auth, expressAdapter(
    (req, ctx) => controller.refreshToken(req.body, ctx),
  ));

  return router;
}
