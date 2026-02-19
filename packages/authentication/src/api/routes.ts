/**
 * Authentication API Routes
 *
 * 路由定义与请求处理。
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 *
 * Routes:
 *   POST   /register   — 用户注册 (RegisterByEmailSchema)
 *   POST   /login      — 用户登录 (LoginByEmailSchema)
 *   POST   /logout     — 用户登出
 *   POST   /refresh    — 刷新访问令牌 (RefreshTokenSchema)
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
import { createExpressHelper } from '@dailyuse/utils/result';

const logger = createLogger('AuthenticationRoutes');

// ============ Types ============

interface AuthUser {
  identityId: string;
  sessionId?: string;
  tokenType?: string;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
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
  // verify2fa(sessionId: string, code: string): Promise<any>;
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

  // POST /register — 用户注册 (RegisterByEmailSchema)
  router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = RegisterByEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      const cx: Context = {
        identityId: '', // 注册时还没有身份
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      const result = await handlers.register(parsed.data, cx);
      return helper.created(result, 'Registration successful');
    } catch (error) {
      logger.error('Register failed:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      return helper.badRequest(message);
    }
  });

  // POST /login — 用户登录 (LoginByEmailSchema)
  router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = LoginByEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      const cx: Context = {
        identityId: '', // 登录时还没有身份
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      const result = await handlers.login(parsed.data, cx);
      return helper.success(result, 'Login successful');
    } catch (error) {
      logger.error('Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      return helper.unauthorized(message);
    }
  });

  // POST /logout — 用户登出
  router.post('/logout', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const cx: Context = {
        identityId: req.user.identityId,
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      await handlers.logout({}, cx);
      return helper.success(null, 'Logout successful');
    } catch (error) {
      logger.error('Logout failed:', error);
      const message = error instanceof Error ? error.message : 'Logout failed';
      return helper.internalError(message);
    }
  });

  // ======== Session Management ========

  // POST /refresh — 刷新访问令牌 (RefreshTokenSchema)
  router.post('/refresh', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = RefreshTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const cx: Context = {
        identityId: req.user.identityId,
        deviceId: (req.headers['x-device-id'] as string) || 'unknown'
      };
      const result = await handlers.refreshToken(parsed.data, cx);
      return helper.success(result, 'Session refreshed successfully');
    } catch (error) {
      logger.error('Refresh token failed:', error);
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      return helper.unauthorized(message);
    }
  });

  /* Temporarily commented out - will implement later
  
  // GET /sessions — 获取活跃会话列表
  router.get('/sessions', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const sessions = await handlers.getActiveSessions(req.user.identityId);
      return helper.success(sessions, 'Active sessions retrieved');
    } catch (error) {
      logger.error('Get active sessions failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to get sessions';
      return helper.internalError(message);
    }
  });

  // DELETE /sessions/:sessionId — 撤销特定会话
  router.delete('/sessions/:sessionId', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const parsed = RevokeSessionSchema.safeParse({ sessionId: req.params.sessionId });
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      await handlers.revokeSession(parsed.data.sessionId, req.user.identityId);
      return helper.success(null, 'Session revoked');
    } catch (error) {
      logger.error('Revoke session failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to revoke session';
      return helper.badRequest(message);
    }
  });

  // POST /logout-all — 全设备登出
  router.post('/logout-all', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      await handlers.revokeAllSessions(req.user.identityId);
      return helper.success(null, 'Logout all devices successful');
    } catch (error) {
      logger.error('Logout all failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to logout all';
      return helper.internalError(message);
    }
  });

  // ======== Two-Factor Authentication ========

  // POST /two-factor/enable — 启用双因素认证
  router.post('/two-factor/enable', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const { method } = req.body;
      const result = await handlers.enable2fa(req.user.identityId, method);
      return helper.success(result, 'Two-factor authentication enabled');
    } catch (error) {
      logger.error('Enable 2FA failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to enable 2FA';
      return helper.badRequest(message);
    }
  });

  // POST /two-factor/disable — 禁用双因素认证
  router.post('/two-factor/disable', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      await handlers.disable2fa(req.user.identityId);
      return helper.success(null, 'Two-factor authentication disabled');
    } catch (error) {
      logger.error('Disable 2FA failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
      return helper.badRequest(message);
    }
  });

  // POST /two-factor/verify — 验证双因素认证代码
  router.post('/two-factor/verify', async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const { code, sessionId } = req.body;
      if (!code || !sessionId) {
        return helper.badRequest('sessionId and code are required');
      }
      const result = await handlers.verify2fa(sessionId, code);
      return helper.success(result, 'Two-factor verification successful');
    } catch (error) {
      logger.error('Verify 2FA failed:', error);
      const message = error instanceof Error ? error.message : 'Verification failed';
      return helper.unauthorized(message);
    }
  });

  // ======== API Keys ========

  // POST /api-keys — 生成新 API 密钥
  router.post('/api-keys', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const { name, expiresInDays } = req.body;
      if (!name) {
        return helper.badRequest('API key name is required');
      }
      const result = await handlers.createApiKey(req.user.identityId, name, expiresInDays);
      return helper.created(result, 'API key generated');
    } catch (error) {
      logger.error('Generate API key failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate API key';
      return helper.badRequest(message);
    }
  });

  // GET /api-keys — 列出所有 API 密钥
  router.get('/api-keys', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const keys = await handlers.listApiKeys(req.user.identityId);
      return helper.success(keys, 'API keys retrieved');
    } catch (error) {
      logger.error('List API keys failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to list API keys';
      return helper.internalError(message);
    }
  });

  // DELETE /api-keys/:keyId — 撤销 API 密钥
  router.delete('/api-keys/:keyId', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      await handlers.revokeApiKey(req.params.keyId, req.user.identityId);
      return helper.success(null, 'API key revoked');
    } catch (error) {
      logger.error('Revoke API key failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to revoke API key';
      return helper.badRequest(message);
    }
  });

  // ======== Password Management ========

  // POST /password/change — 修改密码
  router.post('/password/change', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const parsed = ChangePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      await handlers.changePassword(req.user.identityId, parsed.data.currentPassword, parsed.data.newPassword);
      return helper.success(null, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to change password';
      return helper.badRequest(message);
    }
  });

  // POST /password/forgot — 申请密码重置
  router.post('/password/forgot', async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = ForgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      await handlers.forgotPassword(parsed.data.email);
      return helper.success(null, 'Password reset email sent');
    } catch (error) {
      logger.error('Forgot password failed:', error);
      // Always return success to prevent email enumeration attacks
      return helper.success(null, 'Password reset email sent');
    }
  });

  // POST /password/reset — 重置密码
  router.post('/password/reset', async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = ResetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }
      await handlers.resetPassword(parsed.data.token, parsed.data.newPassword);
      return helper.success(null, 'Password reset successfully');
    } catch (error) {
      logger.error('Reset password failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      return helper.badRequest(message);
    }
  });
  
  End of temporarily commented out routes */

  return router;
}
