/**
 * Account Status Controller
 * 账户状态管理控制器
 *
 * 职责：
 * - 处理账户状态相关的 HTTP 请求
 * - 输入验证
 * - 调用 AccountStatusApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { AccountStatusApplicationService } from '@dailyuse/application-server/account';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountStatusController');

// ==================== 输入验证 Schemas ====================

/**
 * 记录登录请求验证
 */
const recordLoginSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
});

/**
 * 停用账户请求验证
 */
const deactivateAccountSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  reason: z.string().max(500, 'Reason is too long').optional(),
});

/**
 * 删除账户请求验证
 */
const deleteAccountSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE'),
}).refine(
  (data) => data.confirmation === 'DELETE',
  { message: 'Must type DELETE to confirm', path: ['confirmation'] }
);

/**
 * 激活账户请求验证
 */
const activateAccountSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
});

/**
 * Account Status Controller
 */
export class AccountStatusController {
  private static statusService: AccountStatusApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getStatusService(): Promise<AccountStatusApplicationService> {
    if (!AccountStatusController.statusService) {
      AccountStatusController.statusService = await AccountStatusApplicationService.getInstance();
    }
    return AccountStatusController.statusService;
  }

  /**
   * 记录登录
   * @route POST /api/accounts/:accountUuid/login
   * @description 记录账户登录，更新最后登录时间
   */
  static async recordLogin(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountStatusController] Record login request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = recordLoginSchema.parse({ accountUuid });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountStatusController.getStatusService();
      const result = await service.recordLogin({
        accountUuid: validatedData.accountUuid,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountStatusController] Login recorded successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountStatusController.responseBuilder.sendSuccess(
        res,
        {
          account: result.account,
        },
        'Login recorded successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountStatusController] Record login failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountStatusController.responseBuilder.sendError(res, {
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
          return AccountStatusController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }
      }

      return AccountStatusController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Record login failed',
      });
    }
  }

  /**
   * 停用账户
   * @route POST /api/accounts/:accountUuid/deactivate
   * @description 停用账户（可恢复）
   */
  static async deactivateAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountStatusController] Deactivate account request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = deactivateAccountSchema.parse({
        accountUuid,
        reason: req.body.reason,
      });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountStatusController.getStatusService();
      const result = await service.deactivateAccount({
        accountUuid: validatedData.accountUuid,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountStatusController] Account deactivated successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountStatusController.responseBuilder.sendSuccess(
        res,
        {
          account: result.account,
        },
        'Account deactivated successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountStatusController] Deactivate account failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountStatusController.responseBuilder.sendError(res, {
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
          return AccountStatusController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        // 账户已停用
        if (error.message.includes('already deactivated')) {
          return AccountStatusController.responseBuilder.sendSuccess(
            res,
            {
              message: 'Account already deactivated',
            },
            'Account already deactivated',
            200,
          );
        }
      }

      return AccountStatusController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Deactivate account failed',
      });
    }
  }

  /**
   * 删除账户
   * @route DELETE /api/accounts/:accountUuid
   * @description 删除账户（软删除）
   */
  static async deleteAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountStatusController] Delete account request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = deleteAccountSchema.parse({
        accountUuid,
        password: req.body.password,
        confirmation: req.body.confirmation,
      });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountStatusController.getStatusService();
      const result = await service.deleteAccount({
        accountUuid: validatedData.accountUuid,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountStatusController] Account deleted successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountStatusController.responseBuilder.sendSuccess(
        res,
        {
          message: result.message,
        },
        'Account deleted successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountStatusController] Delete account failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountStatusController.responseBuilder.sendError(res, {
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
          return AccountStatusController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        // 密码错误（如果需要验证密码）
        if (error.message.includes('Invalid password')) {
          return AccountStatusController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Invalid password',
          });
        }

        // 账户已删除
        if (error.message.includes('already deleted')) {
          return AccountStatusController.responseBuilder.sendSuccess(
            res,
            {
              message: 'Account already deleted',
            },
            'Account already deleted',
            200,
          );
        }
      }

      return AccountStatusController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Delete account failed',
      });
    }
  }

  /**
   * 激活账户
   * @route POST /api/accounts/:accountUuid/activate
   * @description 激活已停用的账户
   */
  static async activateAccount(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountStatusController] Activate account request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = activateAccountSchema.parse({ accountUuid });

      // ===== 步骤 2: 调用 ApplicationService =====
      // TODO: 需要在 ApplicationService 中实现 activateAccount 方法

      logger.info('[AccountStatusController] Activate account not yet implemented');

      return AccountStatusController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Activate account not yet implemented',
      });
    } catch (error) {
      logger.error('[AccountStatusController] Activate account failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountStatusController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.issues.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return AccountStatusController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Activate account failed',
      });
    }
  }
}


