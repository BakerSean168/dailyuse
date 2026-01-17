import type { Request, Response } from 'express';
import { z } from 'zod';
import { AccountDeletionApplicationService } from '@dailyuse/application-server/account';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountDeletionController');

// ==================== 输入验证 Schemas ====================

/**
 * 账户注销请求验证
 */
const deleteAccountSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  reason: z.string().optional(),
  feedback: z.string().optional(),
  confirmationText: z
    .string()
    .refine((val) => val === 'DELETE', {
      message: 'Confirmation text must be exactly "DELETE"',
    })
    .optional(),
});

/**
 * Account Deletion 控制器
 */
export class AccountDeletionController {
  private static deletionService: AccountDeletionApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getDeletionService(): Promise<AccountDeletionApplicationService> {
    if (!AccountDeletionController.deletionService) {
      AccountDeletionController.deletionService =
        await AccountDeletionApplicationService.getInstance();
    }
    return AccountDeletionController.deletionService;
  }

  /**
   * 账户注销
   * @route POST /api/account/delete
   */
  static async deleteAccount(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AccountDeletionController] Delete account request received', {
        accountUuid: req.body.accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = deleteAccountSchema.parse(req.body);

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountDeletionController.getDeletionService();
      const result = await service.deleteAccount({
        accountUuid: validatedData.accountUuid,
        password: validatedData.password,
        reason: validatedData.reason,
        feedback: validatedData.feedback,
        confirmationText: validatedData.confirmationText,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountDeletionController] Account deleted successfully', {
        accountUuid: result.accountUuid,
      });

      return AccountDeletionController.responseBuilder.sendSuccess(
        res,
        {
          accountUuid: result.accountUuid,
          deletedAt: result.deletedAt,
        },
        result.message,
      );
    } catch (error) {
      logger.error('[AccountDeletionController] Account deletion failed', {
        accountUuid: req.body.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountDeletionController.responseBuilder.sendError(res, {
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
        if (error.message.includes('not found')) {
          return AccountDeletionController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }

        if (error.message.includes('Invalid password')) {
          return AccountDeletionController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: 'Invalid password',
          });
        }

        if (error.message.includes('already deleted')) {
          return AccountDeletionController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: 'Account already deleted',
          });
        }
      }

      return AccountDeletionController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Account deletion failed',
      });
    }
  }
}


