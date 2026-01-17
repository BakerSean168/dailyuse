/**
 * Account Email Controller
 * 账户邮箱管理控制器
 *
 * 职责：
 * - 处理账户邮箱相关的 HTTP 请求
 * - 输入验证
 * - 调用 AccountEmailApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { AccountEmailApplicationService } from '@dailyuse/application-server/account';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountEmailController');

// ==================== 输入验证 Schemas ====================

/**
 * 更新邮箱请求验证
 */
const updateEmailSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  newEmail: z.string().email('Invalid email format'),
});

/**
 * 验证邮箱请求验证
 */
const verifyEmailSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  verificationCode: z.string().length(6, 'Verification code must be 6 characters').optional(),
});

/**
 * Account Email Controller
 */
export class AccountEmailController {
  private static emailService: AccountEmailApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getEmailService(): Promise<AccountEmailApplicationService> {
    if (!AccountEmailController.emailService) {
      AccountEmailController.emailService = await AccountEmailApplicationService.getInstance();
    }
    return AccountEmailController.emailService;
  }

  /**
   * 更新邮箱地址
   * @route PATCH /api/accounts/:accountUuid/email
   * @description 更新账户的邮箱地址（需要验证）
   */
  static async updateEmail(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountEmailController] Update email request received', {
        accountUuid,
        newEmail: req.body.newEmail,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = updateEmailSchema.parse({
        accountUuid,
        newEmail: req.body.newEmail,
      });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountEmailController.getEmailService();
      const result = await service.updateEmail({
        accountUuid: validatedData.accountUuid,
        newEmail: validatedData.newEmail,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountEmailController] Email updated successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountEmailController.responseBuilder.sendSuccess(
        res,
        {
          account: result.account,
          message: result.message,
        },
        'Email updated successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountEmailController] Update email failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountEmailController.responseBuilder.sendError(res, {
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
        if (error.message.includes('not found')) {
          return AccountEmailController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        // 邮箱已被使用
        if (error.message.includes('already exists') || error.message.includes('already in use')) {
          return AccountEmailController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: 'Email already in use',
          });
        }

        // 邮箱格式错误
        if (error.message.includes('Invalid email')) {
          return AccountEmailController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return AccountEmailController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Update email failed',
      });
    }
  }

  /**
   * 验证邮箱
   * @route POST /api/accounts/:accountUuid/email/verify
   * @description 验证账户的邮箱地址
   */
  static async verifyEmail(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountEmailController] Verify email request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = verifyEmailSchema.parse({
        accountUuid,
        verificationCode: req.body.verificationCode,
      });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountEmailController.getEmailService();
      const result = await service.verifyEmail({
        accountUuid: validatedData.accountUuid,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountEmailController] Email verified successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountEmailController.responseBuilder.sendSuccess(
        res,
        {
          account: result.account,
          message: result.message,
        },
        'Email verified successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountEmailController] Verify email failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountEmailController.responseBuilder.sendError(res, {
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
        if (error.message.includes('not found')) {
          return AccountEmailController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        // 邮箱已验证
        if (error.message.includes('already verified')) {
          return AccountEmailController.responseBuilder.sendSuccess(
            res,
            {
              message: 'Email already verified',
            },
            'Email already verified',
            200,
          );
        }

        // 验证码错误（如果使用验证码）
        if (error.message.includes('Invalid verification code')) {
          return AccountEmailController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Invalid verification code',
          });
        }
      }

      return AccountEmailController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Verify email failed',
      });
    }
  }

  /**
   * 重新发送验证邮件
   * @route POST /api/accounts/:accountUuid/email/resend-verification
   * @description 重新发送邮箱验证邮件
   */
  static async resendVerificationEmail(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountEmailController] Resend verification email request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = z
        .object({
          accountUuid: z.string().uuid('Invalid account UUID'),
        })
        .parse({ accountUuid });

      // ===== 步骤 2: 调用 ApplicationService =====
      // TODO: 需要在 ApplicationService 中实现 resendVerificationEmail 方法

      logger.info('[AccountEmailController] Resend verification email not yet implemented');

      return AccountEmailController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Resend verification email not yet implemented',
      });
    } catch (error) {
      logger.error('[AccountEmailController] Resend verification email failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountEmailController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return AccountEmailController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Resend verification email failed',
      });
    }
  }
}


