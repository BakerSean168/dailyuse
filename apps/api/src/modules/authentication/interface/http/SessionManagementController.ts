/**
 * Session Management Controller
 * 会话管理控制器
 *
 * 职责：
 * - 处理会话相关的 HTTP 请求
 * - 输入验证
 * - 调用 SessionManagementApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { 
  GetActiveSessions, 
  RevokeSession, 
  RevokeAllSessions 
} from '@dailyuse/application-server/authentication';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import { isProduction } from '@/shared/infrastructure/config/env.js';

const logger = createLogger('SessionManagementController');

// ==================== 输入验证 Schemas ====================

/**
 * 刷新会话请求验证
 */
const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * 撤销会话请求验证
 */
const revokeSessionSchema = z.object({
  sessionUuid: z.string().uuid('Invalid session UUID'),
  accountUuid: z.string().uuid('Invalid account UUID'),
});

/**
 * 撤销所有会话请求验证
 */
const revokeAllSessionsSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  exceptSessionUuid: z.string().uuid().optional(),
});

/**
 * 获取会话详情请求验证
 */
const getSessionSchema = z.object({
  sessionUuid: z.string().uuid('Invalid session UUID'),
});

/**
 * 获取账户所有会话请求验证
 */
const getAccountSessionsSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  includeExpired: z.boolean().optional(),
});

/**
 * Session Management Controller
 */
export class SessionManagementController {
  private static getActiveSessionsService: GetActiveSessions | null = null;
  private static revokeSessionService: RevokeSession | null = null;
  private static revokeAllSessionsService: RevokeAllSessions | null = null;
  private static responseBuilder = createResponseBuilder();

  private static getGetActiveSessionsService(): GetActiveSessions {
    if (!SessionManagementController.getActiveSessionsService) {
      SessionManagementController.getActiveSessionsService = GetActiveSessions.getInstance();
    }
    return SessionManagementController.getActiveSessionsService;
  }

  private static getRevokeSessionService(): RevokeSession {
    if (!SessionManagementController.revokeSessionService) {
      SessionManagementController.revokeSessionService = RevokeSession.getInstance();
    }
    return SessionManagementController.revokeSessionService;
  }

  private static getRevokeAllSessionsService(): RevokeAllSessions {
    if (!SessionManagementController.revokeAllSessionsService) {
      SessionManagementController.revokeAllSessionsService = RevokeAllSessions.getInstance();
    }
    return SessionManagementController.revokeAllSessionsService;
  }

  /**
   * 刷新会话
   * @route POST /api/auth/sessions/refresh
   * @description 使用 refresh token 刷新 access token
   * @description Refresh Token 从 httpOnly Cookie 中读取
   */
  static async refreshSession(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[SessionManagementController] Refresh session request received');

      // ===== 步骤 1: 从 Cookie 或 Body 读取 Refresh Token =====
      // 优先使用 Cookie（更安全），如果没有则从 Body 读取（向后兼容）
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      
      if (!refreshToken) {
        logger.warn('[SessionManagementController] No refresh token provided');
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Refresh token is required',
          errors: [{
            code: 'MISSING_REFRESH_TOKEN',
            field: 'refreshToken',
            message: 'Refresh token 缺失，请重新登录',
          }],
        });
      }

      logger.debug('[SessionManagementController] Refresh token source:', {
        fromCookie: !!req.cookies?.refreshToken,
        fromBody: !!req.body?.refreshToken,
      });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await SessionManagementController.getSessionService();
      const result = await service.refreshSession({
        refreshToken,
      });

      // ===== 步骤 3: 设置 httpOnly Cookie（Refresh Token）=====
      res.cookie('refreshToken', result.session.refreshToken, {
        httpOnly: true, // 防止 JavaScript 访问（防 XSS）
        secure: isProduction, // 生产环境仅 HTTPS
        sameSite: 'strict', // 防 CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 天
        path: '/',
      });

      logger.info('[SessionManagementController] Session refreshed successfully', {
        sessionUuid: result.session.sessionUuid,
        refreshTokenSetInCookie: true,
      });

      // ===== 步骤 4: 返回成功响应（不包含 Refresh Token）=====
      return SessionManagementController.responseBuilder.sendSuccess(
        res,
        {
          sessionUuid: result.session.sessionUuid,
          accessToken: result.session.accessToken,
          // 🔥 Refresh Token 不再返回给前端，存储在 httpOnly Cookie 中
          expiresAt: result.session.expiresAt,
        },
        'Session refreshed successfully',
        200,
      );
    } catch (error) {
      logger.error('[SessionManagementController] Refresh session failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      if (error instanceof Error) {
        // 🔥 根据错误代码返回友好的错误信息
        const errorCode = (error as any).code;
        const statusCode = (error as any).statusCode || 500;
        const userMessage = (error as any).userMessage;

        // Refresh Token 过期
        if (errorCode === 'REFRESH_TOKEN_EXPIRED') {
          return SessionManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: userMessage || 'Refresh token 已过期，请重新登录',
            errors: [{
              code: 'REFRESH_TOKEN_EXPIRED',
              field: 'refreshToken',
              message: userMessage || '登录已过期（7天），请重新登录',
            }],
          });
        }

        // Session 被撤销
        if (errorCode === 'SESSION_REVOKED') {
          return SessionManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: userMessage || '会话已被撤销',
            errors: [{
              code: 'SESSION_REVOKED',
              field: 'session',
              message: userMessage || '会话已被撤销，请重新登录',
            }],
          });
        }

        // Session 无效
        if (errorCode === 'SESSION_INVALID') {
          return SessionManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: userMessage || '会话无效',
            errors: [{
              code: 'SESSION_INVALID',
              field: 'session',
              message: userMessage || '会话无效，请重新登录',
            }],
          });
        }

        // Refresh token 无效或过期（旧的检查，保持兼容）
        if (
          error.message.includes('Invalid refresh token') ||
          error.message.includes('expired') ||
          error.message.includes('not found')
        ) {
          return SessionManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Invalid or expired refresh token',
          });
        }

        // 会话已被撤销
        if (error.message.includes('revoked')) {
          return SessionManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: 'Session has been revoked',
          });
        }
      }

      return SessionManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Session refresh failed',
      });
    }
  }

  /**
   * 撤销会话（登出）
   * @route DELETE /api/auth/sessions/:sessionUuid
   * @description 撤销指定会话，用户登出
   */
  static async revokeSession(req: Request, res: Response): Promise<Response> {
    try {
      const sessionUuid = req.params.sessionUuid;
      const accountUuid = req.body.accountUuid; // 从 body 获取 accountUuid
      logger.info('[SessionManagementController] Revoke session request received', {
        sessionUuid,
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = revokeSessionSchema.parse({
        sessionUuid,
        accountUuid,
      });

      // ===== 步骤 2: 调用 RevokeSession Use Case =====
      const revokeSessionService = SessionManagementController.getRevokeSessionService();
      await revokeSessionService.execute(validatedData.accountUuid, {
        sessionId: validatedData.sessionUuid,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[SessionManagementController] Session revoked successfully', {
        sessionUuid: validatedData.sessionUuid,
      });

      return SessionManagementController.responseBuilder.sendSuccess(
        res,
        null,
        'Session revoked successfully',
        200,
      );
    } catch (error) {
      logger.error('[SessionManagementController] Revoke session failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      if (error instanceof Error) {
        // 会话未找到
        if (error.message.includes('not found')) {
          return SessionManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Session not found',
          });
        }

        // 会话已经被撤销
        if (error.message.includes('already revoked')) {
          return SessionManagementController.responseBuilder.sendSuccess(
            res,
            null,
            'Session already revoked',
            200,
          );
        }
      }

      return SessionManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Session revocation failed',
      });
    }
  }

  /**
   * 撤销所有会话
   * @route POST /api/auth/sessions/revoke-all
   * @description 撤销账户的所有会话（可选保留当前会话）
   */
  static async revokeAllSessions(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[SessionManagementController] Revoke all sessions request received', {
        accountUuid: req.body.accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = revokeAllSessionsSchema.parse(req.body);

      // ===== 步骤 2: 调用 RevokeAllSessions Use Case =====
      const revokeAllSessionsService = SessionManagementController.getRevokeAllSessionsService();
      await revokeAllSessionsService.execute(validatedData.accountUuid, {
        currentSessionUuid: validatedData.exceptSessionUuid,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[SessionManagementController] All sessions revoked successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return SessionManagementController.responseBuilder.sendSuccess(
        res,
        {
          message: 'All sessions revoked successfully',
        },
        'All sessions revoked successfully',
        200,
      );
    } catch (error) {
      logger.error('[SessionManagementController] Revoke all sessions failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return SessionManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Revoke all sessions failed',
      });
    }
  }

  /**
   * 获取活跃会话列表
   * @route GET /api/auth/sessions/active/:accountUuid
   * @description 获取账户的所有活跃会话
   */
  static async getActiveSessions(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[SessionManagementController] Get active sessions request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = getAccountSessionsSchema.parse({
        accountUuid,
        includeExpired: false,
      });

      // ===== 步骤 2: 调用 GetActiveSessions Use Case =====
      const getActiveSessionsService = SessionManagementController.getGetActiveSessionsService();
      const result = await getActiveSessionsService.execute(validatedData.accountUuid);

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[SessionManagementController] Active sessions retrieved successfully', {
        accountUuid: validatedData.accountUuid,
        count: result.total,
      });

      return SessionManagementController.responseBuilder.sendSuccess(
        res,
        {
          sessions: result.sessions,
          total: result.total,
        },
        'Active sessions retrieved successfully',
        200,
      );
    } catch (error) {
      logger.error('[SessionManagementController] Get active sessions failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return SessionManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Get active sessions failed',
      });
    }
  }

  /**
   * 获取会话详情
   * @route GET /api/auth/sessions/:sessionUuid
   * @description 获取指定会话的详细信息
   */
  static async getSessionDetails(req: Request, res: Response): Promise<Response> {
    try {
      const sessionUuid = req.params.sessionUuid;
      logger.info('[SessionManagementController] Get session details request received', {
        sessionUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = getSessionSchema.parse({ sessionUuid });

      // ===== 步骤 2: 获取会话（暂时从 repository 直接获取）=====
      // TODO: 考虑在 ApplicationService 中添加 getSessionByUuid 方法
      const service = await SessionManagementController.getSessionService();
      const activeSessions = await service.getActiveSessions(req.body.accountUuid || '');
      const session = activeSessions.find((s) => s.uuid === validatedData.sessionUuid);

      if (!session) {
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Session not found',
        });
      }

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[SessionManagementController] Session details retrieved successfully', {
        sessionUuid: validatedData.sessionUuid,
      });

      return SessionManagementController.responseBuilder.sendSuccess(
        res,
        {
          uuid: session.uuid,
          accountUuid: session.accountUuid,
          status: session.status,
          deviceInfo: session.device,
          ipAddress: session.ipAddress,
          location: session.location,
          createdAt: session.createdAt,
          lastActivityAt: session.lastActivityAt,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
        },
        'Session details retrieved successfully',
        200,
      );
    } catch (error) {
      logger.error('[SessionManagementController] Get session details failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return SessionManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return SessionManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Get session details failed',
      });
    }
  }
}


