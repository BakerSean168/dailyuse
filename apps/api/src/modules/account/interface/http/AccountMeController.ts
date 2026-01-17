/**
 * Account Me Controller
 * 当前用户资料管理控制器
 * 
 * 职责：
 * - 处理 /api/accounts/me 端点（需要认证）
 * - 从 JWT Token 提取 accountUuid
 * - 委托给 AccountProfileApplicationService
 */

import type { Request, Response } from 'express';
import {
  AccountProfileApplicationService,
  AccountDeletionApplicationService,
} from '@dailyuse/application-server/account';
import {
  PasswordManagementApplicationService,
  SessionManagementApplicationService,
} from '@dailyuse/application-server/authentication';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { z } from 'zod';

const logger = createLogger('AccountMeController');

/**
 * 修改密码请求验证
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
});

/**
 * 账户删除请求验证
 */
const deleteAccountSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmationText: z.string().refine((val) => val === 'DELETE', {
    message: 'Confirmation text must be "DELETE"',
  }),
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

/**
 * Account Me Controller
 * 处理当前登录用户的资料操作
 */
export class AccountMeController {
  private static profileService: AccountProfileApplicationService | null = null;
  private static passwordService: PasswordManagementApplicationService | null = null;
  private static deletionService: AccountDeletionApplicationService | null = null;
  private static sessionService: SessionManagementApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getProfileService(): Promise<AccountProfileApplicationService> {
    if (!AccountMeController.profileService) {
      AccountMeController.profileService = await AccountProfileApplicationService.getInstance();
    }
    return AccountMeController.profileService;
  }

  private static async getPasswordService(): Promise<PasswordManagementApplicationService> {
    if (!AccountMeController.passwordService) {
      AccountMeController.passwordService =
        await PasswordManagementApplicationService.getInstance();
    }
    return AccountMeController.passwordService;
  }

  private static async getDeletionService(): Promise<AccountDeletionApplicationService> {
    if (!AccountMeController.deletionService) {
      AccountMeController.deletionService = await AccountDeletionApplicationService.getInstance();
    }
    return AccountMeController.deletionService;
  }

  private static async getSessionService(): Promise<SessionManagementApplicationService> {
    if (!AccountMeController.sessionService) {
      AccountMeController.sessionService = await SessionManagementApplicationService.getInstance();
    }
    return AccountMeController.sessionService;
  }

  /**
   * 获取当前用户资料
   * @route GET /api/accounts/me
   * @description 获取当前登录用户的个人资料信息（需要认证）
   */
  static async getMyProfile(req: Request, res: Response): Promise<Response> {
    try {
      // 从认证中间件获取 accountUuid
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Get my profile request', {
        accountUuid,
      });

      // 调用 ApplicationService
      const service = await AccountMeController.getProfileService();
      const account = await service.getProfile(accountUuid);

      logger.info('[AccountMeController] Profile retrieved successfully', {
        accountUuid,
      });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        account,  // 直接返回 account，不要包装成 { account: ... }
        'Profile retrieved successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Get my profile failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error && error.message.includes('not found')) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Account not found',
        });
      }

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Get profile failed',
      });
    }
  }

  /**
   * 更新当前用户资料
   * @route PUT /api/accounts/me
   * @description 更新当前登录用户的个人资料信息（需要认证）
   */
  static async updateMyProfile(req: Request, res: Response): Promise<Response> {
    try {
      // 从认证中间件获取 accountUuid
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Update my profile request', {
        accountUuid,
      });

      // 调用 ApplicationService
      const service = await AccountMeController.getProfileService();
      const result = await service.updateProfile({
        accountUuid,
        displayName: req.body.displayName,
        avatarUrl: req.body.avatarUrl,
        bio: req.body.bio,
        timezone: req.body.timezone,
        language: req.body.language,
      });

      logger.info('[AccountMeController] Profile updated successfully', {
        accountUuid,
      });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        result.account,  // 直接返回 account，不要包装成 { account: ... }
        'Profile updated successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Update my profile failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        if (
          error.message.includes('Display name') ||
          error.message.includes('avatar') ||
          error.message.includes('bio')
        ) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Update profile failed',
      });
    }
  }

  /**
   * 修改当前用户密码
   * @route PUT /api/accounts/me/password
   * @description 修改当前登录用户的密码（需要认证）
   */
  static async changeMyPassword(req: Request, res: Response): Promise<Response> {
    try {
      // 从认证中间件获取 accountUuid
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Change password request', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = changePasswordSchema.parse(req.body);

      // ===== 步骤 2: 调用 PasswordManagementApplicationService =====
      const service = await AccountMeController.getPasswordService();
      const result = await service.changePassword({
        accountUuid,
        currentPassword: validatedData.currentPassword,
        newPassword: validatedData.newPassword,
      });

      logger.info('[AccountMeController] Password changed successfully', {
        accountUuid,
      });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        result,
        'Password changed successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Change password failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // 处理特定错误
      if (error instanceof Error) {
        // 当前密码错误
        if (error.message.includes('Current password is incorrect')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Current password is incorrect',
          });
        }

        // 密码强度不够
        if (
          error.message.includes('Password') &&
          (error.message.includes('must') ||
            error.message.includes('contain') ||
            error.message.includes('characters'))
        ) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }

        // 账户不存在
        if (error.message.includes('not found')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }
      }

      // Zod 验证错误
      if (error instanceof z.ZodError) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.issues[0]?.message || 'Invalid password format',
        });
      }

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Change password failed',
      });
    }
  }

  /**
   * 获取当前用户的活跃会话列表
   * @route GET /api/accounts/me/sessions
   * @description 获取当前登录用户的所有活跃会话（需要认证）
   */
  static async getMySessions(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;
      const currentSessionUuid = (req as AuthenticatedRequest).sessionUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Get sessions request', { accountUuid });

      const service = await AccountMeController.getSessionService();
      const sessions = await service.getActiveSessions(accountUuid);

      // 转换为 DTO 并标记当前会话
      const sessionsDTO = sessions.map((session: any) => ({
        sessionUuid: session.uuid,
        deviceType: session.deviceType || 'UNKNOWN',
        deviceName: session.deviceName || 'Unknown Device',
        browser: session.browser,
        platform: session.platform,
        ipAddress: session.ipAddress,
        lastAccessedAt: session.updatedAt || session.createdAt,
        createdAt: session.createdAt,
        isCurrent: session.uuid === currentSessionUuid,
      }));

      logger.info('[AccountMeController] Sessions retrieved', {
        accountUuid,
        count: sessions.length,
      });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        { sessions: sessionsDTO },
        'Sessions retrieved successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Get sessions failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Get sessions failed',
      });
    }
  }

  /**
   * 撤销特定会话（登出特定设备）
   * @route DELETE /api/accounts/me/sessions/:sessionUuid
   * @description 登出指定设备的会话（需要认证）
   */
  static async revokeMySession(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;
      const sessionUuid = req.params.sessionUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Revoke session request', {
        accountUuid,
        sessionUuid,
      });

      const service = await AccountMeController.getSessionService();
      await service.terminateSession({ accountUuid, sessionUuid });

      logger.info('[AccountMeController] Session revoked', {
        accountUuid,
        sessionUuid,
      });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        { sessionUuid },
        'Session revoked successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Revoke session failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Session not found',
          });
        }

        if (error.message.includes('Unauthorized')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Unauthorized to revoke this session',
          });
        }
      }

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Revoke session failed',
      });
    }
  }

  /**
   * 撤销所有其他会话（登出所有其他设备）
   * @route POST /api/accounts/me/sessions/revoke-others
   * @description 登出除当前设备外的所有其他设备（需要认证）
   */
  static async revokeOtherSessions(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;
      const currentSessionUuid = (req as AuthenticatedRequest).sessionUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Revoke other sessions request', {
        accountUuid,
        currentSessionUuid,
      });

      const service = await AccountMeController.getSessionService();
      await service.terminateAllSessions({
        accountUuid,
        exceptSessionUuid: currentSessionUuid,
      });

      logger.info('[AccountMeController] Other sessions revoked', { accountUuid });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        {},
        'All other sessions revoked successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Revoke other sessions failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Revoke other sessions failed',
      });
    }
  }

  /**
   * 删除当前用户账户（软删除）
   * @route DELETE /api/accounts/me
   * @description 注销当前登录用户的账户（需要认证和密码确认）
   */
  static async deleteMyAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = (req as AuthenticatedRequest).accountUuid;

      if (!accountUuid) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('[AccountMeController] Delete account request', { accountUuid });

      // 验证输入
      const validatedData = deleteAccountSchema.parse(req.body);

      const service = await AccountMeController.getDeletionService();
      const result = await service.deleteAccount({
        accountUuid,
        password: validatedData.password,
        confirmationText: validatedData.confirmationText,
        reason: validatedData.reason,
        feedback: validatedData.feedback,
      });

      logger.info('[AccountMeController] Account deleted', { accountUuid });

      return AccountMeController.responseBuilder.sendSuccess(
        res,
        {
          accountUuid: result.accountUuid,
          deletedAt: result.deletedAt,
        },
        'Account deleted successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountMeController] Delete account failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes('Password is incorrect')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Password is incorrect',
          });
        }

        if (error.message.includes('already deleted')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: 'Account already deleted',
          });
        }

        if (error.message.includes('not found')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        if (error.message.includes('Confirmation text')) {
          return AccountMeController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      if (error instanceof z.ZodError) {
        return AccountMeController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: error.issues[0]?.message || 'Invalid input',
        });
      }

      return AccountMeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Delete account failed',
      });
    }
  }
}


