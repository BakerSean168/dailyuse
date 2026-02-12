/**
 * Authentication API Routes
 *
 * Route definitions for the Authentication module.
 * Middleware is injected via parameters (from ApiBootstrapper context).
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  LoginByEmailSchema,
  RegisterByEmailSchema,
  // ChangePasswordSchema,
  // ForgotPasswordSchema,
  // ResetPasswordSchema,
  RefreshTokenSchema,
  // RevokeSessionSchema,
} from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationRoutes');

// ============ Types ============

interface AuthUser {
  identityId: string;
  sessionId?: string;
  sessionUuid?: string;
  tokenType?: string;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface AuthenticationRouteHandlers {
  register(data: any, cx: Context): Promise<any>;
  login(data: any, cx: Context): Promise<any>;
  logout(data: any, cx: Context): Promise<void>;
  refreshToken(data: any, cx: Context): Promise<any>;
  // getActiveSessions(identityId: string): Promise<any>;
  // revokeSession(sessionId: string, identityId: string): Promise<void>;
  // revokeAllSessions(identityId: string): Promise<void>;
  // enable2fa(identityId: string, method: string): Promise<any>;
  // disable2fa(identityId: string): Promise<void>;
  // verify2fa(sessionUuid: string, code: string): Promise<any>;
  // createApiKey(identityId: string, name: string, expiresInDays?: number): Promise<any>;
  // listApiKeys(identityId: string): Promise<any>;
  // revokeApiKey(keyId: string, identityId: string): Promise<void>;
  // changePassword(identityId: string, currentPassword: string, newPassword: string): Promise<void>;
  // forgotPassword(email: string): Promise<void>;
  // resetPassword(token: string, newPassword: string): Promise<void>;
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

  // ======== Login & Registration ========

  // POST /register �?用户注册
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const parsed = RegisterByEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      const cx: Context = {
        identityId: '', // 注册时还没有身份
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      const result = await handlers.register(parsed.data, cx);
      res.status(201).json({ success: true, data: result, message: 'Registration successful' });
    } catch (error) {
      logger.error('Register failed:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ success: false, message });
    }
  });

  // POST /login �?用户登录
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const parsed = LoginByEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      const cx: Context = {
        identityId: '', // 登录时还没有身份
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      const result = await handlers.login(parsed.data, cx);
      res.json({ success: true, data: result, message: 'Login successful' });
    } catch (error) {
      logger.error('Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ success: false, message });
    }
  });

  // POST /logout �?用户登出
  router.post('/logout', auth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const cx: Context = {
        identityId: authReq.user.identityId,
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      await handlers.logout({}, cx);
      res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout failed:', error);
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({ success: false, message });
    }
  });

  // ======== Session Management ========

  // POST /refresh �?刷新访问令牌
  router.post('/refresh', auth, async (req: Request, res: Response) => {
    try {
      const parsed = RefreshTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const cx: Context = {
        identityId: authReq.user.identityId,
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      const result = await handlers.refreshToken(parsed.data, cx);
      res.json({ success: true, data: result, message: 'Session refreshed successfully' });
    } catch (error) {
      logger.error('Refresh token failed:', error);
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ success: false, message });
    }
  });

  /* Temporarily commented out - will implement later
  
  // GET /sessions �?获取活跃会话列表
  router.get('/sessions', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const sessions = await handlers.getActiveSessions(req.user.identityId);
      res.json({ success: true, data: sessions, message: 'Active sessions retrieved' });
    } catch (error) {
      logger.error('Get active sessions failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to get sessions';
      res.status(500).json({ success: false, message });
    }
  });

  // DELETE /sessions/:sessionUuid �?撤销特定会话
  router.delete('/sessions/:sessionUuid', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const parsed = RevokeSessionSchema.safeParse({ sessionId: req.params.sessionUuid });
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      await handlers.revokeSession(parsed.data.sessionId, req.user.identityId);
      res.json({ success: true, message: 'Session revoked' });
    } catch (error) {
      logger.error('Revoke session failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to revoke session';
      res.status(400).json({ success: false, message });
    }
  });

  // POST /logout-all �?全设备登�?
  router.post('/logout-all', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      await handlers.revokeAllSessions(req.user.identityId);
      res.json({ success: true, message: 'Logout all devices successful' });
    } catch (error) {
      logger.error('Logout all failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to logout all';
      res.status(500).json({ success: false, message });
    }
  });

  // ======== Two-Factor Authentication ========

  // POST /two-factor/enable �?启用双因素认�?
  router.post('/two-factor/enable', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { method } = req.body;
      const result = await handlers.enable2fa(req.user.identityId, method);
      res.json({ success: true, data: result, message: 'Two-factor authentication enabled' });
    } catch (error) {
      logger.error('Enable 2FA failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to enable 2FA';
      res.status(400).json({ success: false, message });
    }
  });

  // POST /two-factor/disable �?禁用双因素认�?
  router.post('/two-factor/disable', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      await handlers.disable2fa(req.user.identityId);
      res.json({ success: true, message: 'Two-factor authentication disabled' });
    } catch (error) {
      logger.error('Disable 2FA failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
      res.status(400).json({ success: false, message });
    }
  });

  // POST /two-factor/verify �?验证双因素认证代�?
  router.post('/two-factor/verify', async (req: Request, res: Response) => {
    try {
      const { code, sessionUuid } = req.body;
      if (!code || !sessionUuid) {
        res.status(400).json({ success: false, message: 'sessionUuid and code are required' });
        return;
      }
      const result = await handlers.verify2fa(sessionUuid, code);
      res.json({ success: true, data: result, message: 'Two-factor verification successful' });
    } catch (error) {
      logger.error('Verify 2FA failed:', error);
      const message = error instanceof Error ? error.message : 'Verification failed';
      res.status(401).json({ success: false, message });
    }
  });

  // ======== API Keys ========

  // POST /api-keys �?生成�?API 密钥
  router.post('/api-keys', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { name, expiresInDays } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'API key name is required' });
        return;
      }
      const result = await handlers.createApiKey(req.user.identityId, name, expiresInDays);
      res.status(201).json({ success: true, data: result, message: 'API key generated' });
    } catch (error) {
      logger.error('Generate API key failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate API key';
      res.status(400).json({ success: false, message });
    }
  });

  // GET /api-keys �?列出所�?API 密钥
  router.get('/api-keys', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const keys = await handlers.listApiKeys(req.user.identityId);
      res.json({ success: true, data: keys, message: 'API keys retrieved' });
    } catch (error) {
      logger.error('List API keys failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to list API keys';
      res.status(500).json({ success: false, message });
    }
  });

  // DELETE /api-keys/:keyId �?撤销 API 密钥
  router.delete('/api-keys/:keyId', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      await handlers.revokeApiKey(req.params.keyId, req.user.identityId);
      res.json({ success: true, message: 'API key revoked' });
    } catch (error) {
      logger.error('Revoke API key failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to revoke API key';
      res.status(400).json({ success: false, message });
    }
  });

  // ======== Password Management ========

  // POST /password/change �?修改密码
  router.post('/password/change', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.identityId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const parsed = ChangePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      await handlers.changePassword(req.user.identityId, parsed.data.currentPassword, parsed.data.newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to change password';
      res.status(400).json({ success: false, message });
    }
  });

  // POST /password/forgot �?申请密码重置
  router.post('/password/forgot', async (req: Request, res: Response) => {
    try {
      const parsed = ForgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      await handlers.forgotPassword(parsed.data.email);
      res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      logger.error('Forgot password failed:', error);
      // Always return success to prevent email enumeration attacks
      res.json({ success: true, message: 'Password reset email sent' });
    }
  });

  // POST /password/reset �?重置密码
  router.post('/password/reset', async (req: Request, res: Response) => {
    try {
      const parsed = ResetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues,
        });
        return;
      }
      await handlers.resetPassword(parsed.data.token, parsed.data.newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      logger.error('Reset password failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      res.status(400).json({ success: false, message });
    }
  });
  
  End of temporarily commented out routes */

  return router;
}
