/**
 * Authentication API Routes
 *
 * Uses expressAdapter to eliminate boilerplate code.
 *
 * Routes:
 *   POST   /register   — 用户注册 (RegisterByEmailSchema)
 *   POST   /login      — 用户登录 (LoginByEmailSchema)
 *   POST   /logout     — 用户登出
 *   POST   /refresh    — 刷新访问令牌 (RefreshTokenSchema)
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { Context } from '@dailyuse/contracts/shared';
import { expressAdapter } from '@dailyuse/utils/result';
import { AuthenticationController } from './controller';

// ============ Types ============

export interface AuthenticationRouteHandlers {
  register(data: any, cx: Context): Promise<any>;
  login(data: any, cx: Context): Promise<any>;
  logout(data: any, cx: Context): Promise<void>;
  refreshToken(data: any, cx: Context): Promise<any>;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerAuthenticationRoutes(
  handlers: AuthenticationRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new AuthenticationController(handlers);

  // POST /register — 用户注册 (no auth required)
  router.post('/register', expressAdapter(
    (req) => {
      const cx: Context = {
        identityId: '',
        deviceId: (req.headers?.['x-device-id'] as string) || 'unknown',
      };
      return controller.register(req.body, cx);
    },
    { requireAuth: false, successStatus: 201 },
  ));

  // POST /login — 用户登录 (no auth required)
  router.post('/login', expressAdapter(
    (req) => {
      const cx: Context = {
        identityId: '',
        deviceId: (req.headers?.['x-device-id'] as string) || 'unknown',
      };
      return controller.login(req.body, cx);
    },
    { requireAuth: false },
  ));

  // POST /logout — 用户登出
  router.post('/logout', auth, expressAdapter(
    (req, ctx) => {
      const cx: Context = {
        identityId: ctx.identityId,
        deviceId: (req.headers?.['x-device-id'] as string) || 'unknown',
      };
      return controller.logout(cx);
    },
  ));

  // POST /refresh — 刷新访问令牌
  router.post('/refresh', auth, expressAdapter(
    (req, ctx) => {
      const cx: Context = {
        identityId: ctx.identityId,
        deviceId: (req.headers?.['x-device-id'] as string) || 'unknown',
      };
      return controller.refreshToken(req.body, cx);
    },
  ));

  return router;
}
