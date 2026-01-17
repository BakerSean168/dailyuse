/**
 * Password Management Controller
 * 密码管理控制器
 *
 * 职责：
 * - 处理密码相关的 HTTP 请求
 * - 输入验证
 * - 调用 PasswordManagementApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { 
  ChangePassword,
  ForgotPassword,
  ResetPassword
} from '@dailyuse/application-server/authentication';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PasswordManagementController');

// ==================== 输入验证 Schemas ====================

/**
 * 修改密码请求验证
 */
const changePasswordSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
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
 * 重置密码请求验证
 */
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
  resetToken: z.string().optional(),
});

/**
 * Password Management Controller
 */
export class PasswordManagementController {
  private static changePasswordService: ChangePassword | null = null;
  private static forgotPasswordService: ForgotPassword | null = null;
  private static resetPasswordService: ResetPassword | null = null;
  private static responseBuilder = createResponseBuilder();

  private static getChangePasswordService(): ChangePassword {
    if (!PasswordManagementController.changePasswordService) {
      PasswordManagementController.changePasswordService = ChangePassword.getInstance();
    }
    return PasswordManagementController.changePasswordService;
  }

  private static getForgotPasswordService(): ForgotPassword {
    if (!PasswordManagementController.forgotPasswordService) {
      PasswordManagementController.forgotPasswordService = ForgotPassword.getInstance();
    }
    return PasswordManagementController.forgotPasswordService;
  }

  private static getResetPasswordService(): ResetPassword {
    if (!PasswordManagementController.resetPasswordService) {
      PasswordManagementController.resetPasswordService = ResetPassword.getInstance();
    }
    return PasswordManagementController.resetPasswordService;
  }

  /**
   * 修改密码
   * @route PUT /api/auth/password/change
   * @description 用户修改自己的密码（需要提供当前密码）
   */
  static async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[PasswordManagementController] Change password request received', {
        accountUuid: req.body.accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = changePasswordSchema.parse(req.body);

      // ===== 步骤 2: 调用 ChangePassword Use Case =====
      const changePasswordService = PasswordManagementController.getChangePasswordService();
      const result = await changePasswordService.execute({
        accountUuid: validatedData.accountUuid,
        currentPassword: validatedData.currentPassword,
        newPassword: validatedData.newPassword,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[PasswordManagementController] Password changed successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return PasswordManagementController.responseBuilder.sendSuccess(
        res,
        result,
        'Password changed successfully',
        200,
      );
    } catch (error) {
      logger.error('[PasswordManagementController] Change password failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return PasswordManagementController.responseBuilder.sendError(res, {
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
        // 当前密码错误
        if (
          error.message.includes('Invalid current password') ||
          error.message.includes('Current password is incorrect')
        ) {
          return PasswordManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Current password is incorrect',
          });
        }

        // 新密码与当前密码相同
        if (error.message.includes('same as current password')) {
          return PasswordManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.BUSINESS_ERROR,
            message: 'New password must be different from current password',
          });
        }

        // 凭证未找到
        if (error.message.includes('Credential not found')) {
          return PasswordManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account credentials not found',
          });
        }
      }

      return PasswordManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Password change failed',
      });
    }
  }

  /**
   * 重置密码
   * @route POST /api/auth/password/reset
   * @description 通过邮箱重置密码（忘记密码场景）
   * @note 实际应用中，应该先通过 email 查找 accountUuid
   */
  static async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[PasswordManagementController] Reset password request received', {
        email: req.body.email,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = resetPasswordSchema.parse(req.body);

      // ===== 步骤 2: 通过 email 查找账户（实际应用中需要实现）=====
      // TODO: 添加通过 email 查找 accountUuid 的逻辑
      // const accountRepository = await getAccountRepository();
      // const account = await accountRepository.findByEmail(validatedData.email);
      // if (!account) { throw new Error('Account not found'); }

      // ===== 步骤 3: 调用 ApplicationService =====
      // NOTE: 这里需要 accountUuid，实际应用中应该从数据库查询
      logger.warn('[PasswordManagementController] Password reset not fully implemented');

      return PasswordManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.BUSINESS_ERROR,
        message:
          'Password reset requires additional implementation - need to lookup accountUuid by email',
      });
    } catch (error) {
      logger.error('[PasswordManagementController] Reset password failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return PasswordManagementController.responseBuilder.sendError(res, {
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
        // 账户未找到
        if (error.message.includes('Account not found')) {
          return PasswordManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account with this email not found',
          });
        }

        // 重置令牌无效或过期
        if (error.message.includes('Invalid reset token') || error.message.includes('expired')) {
          return PasswordManagementController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Invalid or expired reset token',
          });
        }
      }

      return PasswordManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Password reset failed',
      });
    }
  }

  /**
   * 验证密码强度
   * @route POST /api/auth/password/validate
   * @description 验证密码是否符合安全要求
   */
  static async validatePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { password } = req.body;

      if (!password || typeof password !== 'string') {
        return PasswordManagementController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Password is required',
        });
      }

      // 使用 Zod schema 验证密码强度
      const passwordSchema = z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must not exceed 100 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain uppercase, lowercase, number and special character',
        );

      const result = passwordSchema.safeParse(password);

      if (result.success) {
        return PasswordManagementController.responseBuilder.sendSuccess(
          res,
          { valid: true, strength: 'strong' },
          'Password meets security requirements',
        );
      } else {
        return PasswordManagementController.responseBuilder.sendSuccess(
          res,
          {
            valid: false,
            errors: result.error.issues.map((err) => err.message),
          },
          'Password does not meet security requirements',
        );
      }
    } catch (error) {
      logger.error('[PasswordManagementController] Validate password failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return PasswordManagementController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Password validation failed',
      });
    }
  }
}


