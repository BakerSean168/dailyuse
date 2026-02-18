/**
 * Account API Routes
 *
 * 路由定义与请求处理。
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 *
 * Routes:
 *   GET    /me             — 获取当前用户资料
 *   PUT    /me             — 更新当前用户资料 (UpdateAccountSchema)
 *   POST   /availability   — 检查可用性 (CheckAvailabilitySchema)
 *   POST   /me/close       — 注销账户 (CloseAccountSchema)
 *   DELETE /me             — 注销账户（别名）
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  UpdateAccountSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
} from '@dailyuse/contracts/account';
import { createExpressHelper } from '@dailyuse/utils/result';

// ============ Types ============

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
  user?: {
    identityId: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
}

export interface AccountRouteHandlers {
  getProfile(accountId: string): Promise<any>;
  updateProfile(accountId: string, data: any): Promise<any>;
  checkAvailability(data: any): Promise<any>;
  closeAccount(accountId: string, data: any): Promise<any>;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerAccountRoutes(
  handlers: AccountRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // GET /me — 获取当前用户资料
  router.get('/me', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const profile = await handlers.getProfile(req.user.identityId);
      return helper.success(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // PUT /me — 更新当前用户资料 (UpdateAccountSchema)
  router.put('/me', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const parsed = UpdateAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.updateProfile(req.user.identityId, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return helper.badRequest(message);
    }
  });

  // POST /availability — 检查可用性 (CheckAvailabilitySchema)
  router.post('/availability', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = CheckAvailabilitySchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.checkAvailability(parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check failed';
      return helper.internalError(message);
    }
  });

  // POST /me/close — 注销账户 (CloseAccountSchema)
  router.post('/me/close', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const parsed = CloseAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      await handlers.closeAccount(req.user.identityId, parsed.data);
      return helper.success(null, 'Account closed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Close failed';
      return helper.badRequest(message);
    }
  });

  // DELETE /me — 注销账户（别名）
  router.delete('/me', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      await handlers.closeAccount(req.user.identityId, req.body);
      return helper.success(null, 'Account closed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Close failed';
      return helper.badRequest(message);
    }
  });

  return router;
}
