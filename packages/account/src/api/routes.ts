/**
 * Account API Routes
 *
 * Route definitions for the Account module.
 * Middleware is injected via parameters (from ApiBootstrapper context).
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  UpdateAccountSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
} from '@dailyuse/contracts/account';

// ============ Types ============

interface AuthenticatedRequest extends Request {
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

  // GET /me �?获取当前用户资料
  router.get('/me', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await handlers.getProfile(req.user.identityId);
      res.json({ success: true, data: profile });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      res.status(500).json({ success: false, message });
    }
  });

  // PUT /me �?更新当前用户资料
  router.put('/me', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = UpdateAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }

      const result = await handlers.updateProfile(req.user.identityId, parsed.data);
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      res.status(400).json({ success: false, message });
    }
  });

  // POST /availability �?检查可用�?
  router.post('/availability', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = CheckAvailabilitySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }

      const result = await handlers.checkAvailability(parsed.data);
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check failed';
      res.status(500).json({ success: false, message });
    }
  });

  // POST /me/close �?注销账户
  router.post('/me/close', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = CloseAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }

      await handlers.closeAccount(req.user.identityId, parsed.data);
      res.json({ success: true, message: 'Account closed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Close failed';
      res.status(400).json({ success: false, message });
    }
  });

  // DELETE /me �?注销账户（别名）
  router.delete('/me', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await handlers.closeAccount(req.user.identityId, req.body);
      res.json({ success: true, message: 'Account closed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Close failed';
      res.status(400).json({ success: false, message });
    }
  });

  return router;
}
