/**
 * Two-Factor Authentication Controller
 * 双因素认证控制器
 *
 * 职责：
 * - 处理 2FA 相关的 HTTP 请求
 * - 输入验证
 * - 调用 TwoFactorApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { 
  Enable2FA,
  Disable2FA,
  Verify2FA
} from '@dailyuse/application-server/authentication';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TwoFactorController');

// ==================== 输入验证 Schemas ====================

/**
 * 启用 2FA 请求验证
 */
const enableTwoFactorSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  method: z.enum(['TOTP', 'SMS', 'EMAIL', 'AUTHENTICATOR_APP'], {
    message: 'Method must be one of: TOTP, SMS, EMAIL, AUTHENTICATOR_APP'
  }),
  secret: z.string().min(1, 'Secret is required'),
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

/**
 * 禁用 2FA 请求验证
 */
const disableTwoFactorSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * 验证 2FA 代码请求验证
 */
const verifyTwoFactorSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

/**
 * Two-Factor Authentication Controller
 */
export class TwoFactorController {
  private static enable2FAService: Enable2FA | null = null;
  private static disable2FAService: Disable2FA | null = null;
  private static verify2FAService: Verify2FA | null = null;
  private static responseBuilder = createResponseBuilder();

  private static getEnable2FAService(): Enable2FA {
    if (!TwoFactorController.enable2FAService) {
      TwoFactorController.enable2FAService = Enable2FA.getInstance();
    }
    return TwoFactorController.enable2FAService;
  }

  private static getDisable2FAService(): Disable2FA {
    if (!TwoFactorController.disable2FAService) {
      TwoFactorController.disable2FAService = Disable2FA.getInstance();
    }
    return TwoFactorController.disable2FAService;
  }

  private static getVerify2FAService(): Verify2FA {
    if (!TwoFactorController.verify2FAService) {
      TwoFactorController.verify2FAService = Verify2FA.getInstance();
    }
    return TwoFactorController.verify2FAService;
  }

  /**
   * 启用双因素认证
   * @route POST /api/auth/2fa/enable
   * @description 启用账户的 2FA 功能
   */
  static async enableTwoFactor(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[TwoFactorController] Enable 2FA request received', {
        accountUuid: req.body.accountUuid,
        method: req.body.method,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = enableTwoFactorSchema.parse(req.body);

      // ===== 步骤 2: 调用 Enable2FA Use Case =====
      const enable2FAService = TwoFactorController.getEnable2FAService();
      const result = await enable2FAService.execute({
        accountUuid: validatedData.accountUuid,
        method: validatedData.method,
        secret: validatedData.secret,
        verificationCode: validatedData.verificationCode,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[TwoFactorController] 2FA enabled successfully', {
        accountUuid: validatedData.accountUuid,
        method: validatedData.method,
      });

      return TwoFactorController.responseBuilder.sendSuccess(
        res,
        {
          backupCodes: result.backupCodes,
          message: result.message,
        },
        '2FA enabled successfully',
        200,
      );
    } catch (error) {
      logger.error('[TwoFactorController] Confirm 2FA failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return TwoFactorController.responseBuilder.sendError(res, {
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
        // 验证码无效
        if (error.message.includes('Invalid')) {
          return TwoFactorController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Invalid verification code',
          });
        }

        // 凭证未找到
        if (error.message.includes('not found')) {
          return TwoFactorController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Credential not found',
          });
        }
      }

      return TwoFactorController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Enable 2FA failed',
      });
    }
  }

  /**
   * 禁用双因素认证
   * @route POST /api/auth/2fa/disable
   * @description 禁用账户的 2FA 功能
   */
  static async disableTwoFactor(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[TwoFactorController] Disable 2FA request received', {
        accountUuid: req.body.accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = disableTwoFactorSchema.parse(req.body);

      // ===== 步骤 2: 调用 Disable2FA Use Case =====
      const disable2FAService = TwoFactorController.getDisable2FAService();
      await disable2FAService.execute({
        accountUuid: validatedData.accountUuid,
        password: validatedData.password,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[TwoFactorController] 2FA disabled successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return TwoFactorController.responseBuilder.sendSuccess(
        res,
        {
          message: '双因素认证已成功禁用',
        },
        '2FA disabled successfully',
        200,
      );
    } catch (error) {
      logger.error('[TwoFactorController] Disable 2FA failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return TwoFactorController.responseBuilder.sendError(res, {
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
        // 密码错误
        if (error.message.includes('password') && error.message.includes('Invalid')) {
          return TwoFactorController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Incorrect password',
          });
        }

        // 2FA 未启用
        if (error.message.includes('not found')) {
          return TwoFactorController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Credential not found',
          });
        }
      }

      return TwoFactorController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Disable 2FA failed',
      });
    }
  }

  /**
   * 验证双因素认证代码
   * @route POST /api/auth/2fa/verify
   * @description 验证用户输入的 2FA 代码
   */
  static async verifyTwoFactorCode(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[TwoFactorController] Verify 2FA request received', {
        accountUuid: req.body.accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = verifyTwoFactorSchema.parse(req.body);

      // ===== 步骤 2: 调用 Verify2FA Use Case =====
      const verify2FAService = TwoFactorController.getVerify2FAService();
      const isValid = await verify2FAService.execute({
        accountUuid: validatedData.accountUuid,
        code: validatedData.code,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[TwoFactorController] 2FA verification result', {
        accountUuid: validatedData.accountUuid,
        isValid,
      });

      if (isValid) {
        return TwoFactorController.responseBuilder.sendSuccess(
          res,
          {
            isValid: true,
            message: '验证码正确',
          },
          '2FA verification successful',
          200,
        );
      } else {
        return TwoFactorController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Invalid verification code',
        });
      }
    } catch (error) {
      logger.error('[TwoFactorController] Verify 2FA failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return TwoFactorController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return TwoFactorController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: '2FA verification failed',
      });
    }
  }
}


