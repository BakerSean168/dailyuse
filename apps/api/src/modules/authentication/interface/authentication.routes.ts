/**
 * Authentication Routes
 * 认证模块路由 - 纯 HTTP 适配层
 *
 * 职责：
 * - 解析 HTTP 请求
 * - 调用应用服务
 * - 返回 HTTP 响应
 *
 * 不包含：业务逻辑、数据访问、DI 初始化（都在 packages 中）
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { deviceInfoMiddleware } from '../../../shared/infrastructure/http/middlewares/index';
import {
  AuthenticationApplicationService,
  SessionManagementApplicationService,
  TwoFactorApplicationService,
  ApiKeyApplicationService,
} from '@dailyuse/application-server';
import { AccountApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationRoutes');
const router: Router = ExpressRouter();
const responseBuilder = createResponseBuilder();

// ===== 登录注册 =====

router.post('/register', deviceInfoMiddleware, async (req, res) => {
  try {
    const { username, email, password, profile } = req.body;
    const result = await AccountApplicationService.register({
      username,
      email,
      password,
      profile,
    });
    res.status(201).json(responseBuilder.success(result, 'Registration successful'));
  } catch (error) {
    logger.error('Register failed:', error);
    throw error;
  }
});

router.post('/login', deviceInfoMiddleware, async (req, res) => {
  try {
    const { identifier, password, deviceInfo, ipAddress, location } = req.body;
    const result = await AuthenticationApplicationService.login({
      identifier,
      password,
      deviceInfo,
      ipAddress,
      location,
    });
    res.json(responseBuilder.success(result, 'Login successful'));
  } catch (error) {
    logger.error('Login failed:', error);
    throw error;
  }
});

// ===== 会话管理 =====

router.post('/logout', async (req: AuthenticatedRequest, res) => {
  try {
    await SessionManagementApplicationService.logout(req.user.sessionId);
    res.json(responseBuilder.success(null, 'Logout successful'));
  } catch (error) {
    logger.error('Logout failed:', error);
    throw error;
  }
});

router.post('/logout-all', async (req: AuthenticatedRequest, res) => {
  try {
    const { accountUuid } = req.body;
    if (req.user.accountUuid !== accountUuid) {
      return res.status(403).json(responseBuilder.error(ResponseCode.FORBIDDEN, 'Access denied'));
    }
    await SessionManagementApplicationService.logoutAll(accountUuid);
    res.json(responseBuilder.success(null, 'Logout all devices successful'));
  } catch (error) {
    logger.error('Logout all failed:', error);
    throw error;
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await SessionManagementApplicationService.refreshSession(refreshToken);
    res.json(responseBuilder.success(result, 'Session refreshed successfully'));
  } catch (error) {
    logger.error('Refresh token failed:', error);
    throw error;
  }
});

router.get('/sessions', async (req: AuthenticatedRequest, res) => {
  try {
    const sessions = await SessionManagementApplicationService.getActiveSessions(
      req.user.accountUuid,
    );
    res.json(responseBuilder.success(sessions, 'Active sessions retrieved'));
  } catch (error) {
    logger.error('Get active sessions failed:', error);
    throw error;
  }
});

router.delete('/sessions/:sessionUuid', async (req: AuthenticatedRequest, res) => {
  try {
    await SessionManagementApplicationService.revokeSession(
      req.params.sessionUuid,
      req.user.accountUuid,
    );
    res.json(responseBuilder.success(null, 'Session revoked'));
  } catch (error) {
    logger.error('Revoke session failed:', error);
    throw error;
  }
});

// ===== 双因素认证 =====

router.post('/two-factor/enable', async (req: AuthenticatedRequest, res) => {
  try {
    const { method } = req.body;
    const result = await TwoFactorApplicationService.enableTwoFactor(req.user.accountUuid, method);
    res.json(responseBuilder.success(result, 'Two-factor authentication enabled'));
  } catch (error) {
    logger.error('Enable 2FA failed:', error);
    throw error;
  }
});

router.post('/two-factor/disable', async (req: AuthenticatedRequest, res) => {
  try {
    await TwoFactorApplicationService.disableTwoFactor(req.user.accountUuid);
    res.json(responseBuilder.success(null, 'Two-factor authentication disabled'));
  } catch (error) {
    logger.error('Disable 2FA failed:', error);
    throw error;
  }
});

router.post('/two-factor/verify', async (req, res) => {
  try {
    const { code, sessionUuid } = req.body;
    const result = await TwoFactorApplicationService.verify(sessionUuid, code);
    res.json(responseBuilder.success(result, 'Two-factor verification successful'));
  } catch (error) {
    logger.error('Verify 2FA failed:', error);
    throw error;
  }
});

// ===== API 密钥管理 =====

router.post('/api-keys', async (req: AuthenticatedRequest, res) => {
  try {
    const { name, expiresInDays } = req.body;
    const result = await ApiKeyApplicationService.generateApiKey(
      req.user.accountUuid,
      name,
      expiresInDays,
    );
    res.status(201).json(responseBuilder.success(result, 'API key generated'));
  } catch (error) {
    logger.error('Generate API key failed:', error);
    throw error;
  }
});

router.get('/api-keys', async (req: AuthenticatedRequest, res) => {
  try {
    const keys = await ApiKeyApplicationService.listApiKeys(req.user.accountUuid);
    res.json(responseBuilder.success(keys, 'API keys retrieved'));
  } catch (error) {
    logger.error('List API keys failed:', error);
    throw error;
  }
});

router.delete('/api-keys/:keyId', async (req: AuthenticatedRequest, res) => {
  try {
    await ApiKeyApplicationService.revokeApiKey(req.params.keyId, req.user.accountUuid);
    res.json(responseBuilder.success(null, 'API key revoked'));
  } catch (error) {
    logger.error('Revoke API key failed:', error);
    throw error;
  }
});

// ===== 密码管理 =====

router.post('/password/change', async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthenticationApplicationService.changePassword(
      req.user.accountUuid,
      currentPassword,
      newPassword,
    );
    res.json(responseBuilder.success(null, 'Password changed successfully'));
  } catch (error) {
    logger.error('Change password failed:', error);
    throw error;
  }
});

router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    await AuthenticationApplicationService.forgotPassword(email);
    res.json(responseBuilder.success(null, 'Password reset email sent'));
  } catch (error) {
    logger.error('Forgot password failed:', error);
    throw error;
  }
});

router.post('/password/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await AuthenticationApplicationService.resetPassword(token, newPassword);
    res.json(responseBuilder.success(null, 'Password reset successfully'));
  } catch (error) {
    logger.error('Reset password failed:', error);
    throw error;
  }
});

export default router;
