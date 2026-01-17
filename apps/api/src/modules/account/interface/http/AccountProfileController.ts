/**
 * Account Profile Controller
 * 账户资料管理控制器
 *
 * 职责：
 * - 处理账户资料相关的 HTTP 请求
 * - 输入验证
 * - 调用 AccountProfileApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { AccountProfileApplicationService } from '@dailyuse/application-server/account';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountProfileController');

// ==================== 输入验证 Schemas ====================

/**
 * 更新账户资料请求验证
 */
const updateProfileSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  displayName: z.string().min(1).max(100, 'Display name is too long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2, 'Language code must be 2 characters').optional(),
});

/**
 * 获取账户资料请求验证
 */
const getProfileSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
});

/**
 * Account Profile Controller
 */
export class AccountProfileController {
  private static profileService: AccountProfileApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getProfileService(): Promise<AccountProfileApplicationService> {
    if (!AccountProfileController.profileService) {
      AccountProfileController.profileService =
        await AccountProfileApplicationService.getInstance();
    }
    return AccountProfileController.profileService;
  }

  /**
   * 更新账户资料
   * @route PATCH /api/accounts/:accountUuid/profile
   * @description 更新账户的个人资料信息
   */
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountProfileController] Update profile request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = updateProfileSchema.parse({
        accountUuid,
        ...req.body,
      });

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AccountProfileController.getProfileService();
      const result = await service.updateProfile({
        accountUuid: validatedData.accountUuid,
        displayName: validatedData.displayName,
        avatarUrl: validatedData.avatarUrl,
        bio: validatedData.bio,
        timezone: validatedData.timezone,
        language: validatedData.language,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountProfileController] Profile updated successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountProfileController.responseBuilder.sendSuccess(
        res,
        {
          account: result.account,
        },
        'Profile updated successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountProfileController] Update profile failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountProfileController.responseBuilder.sendError(res, {
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
          return AccountProfileController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }

        // 资料验证错误
        if (
          error.message.includes('Display name') ||
          error.message.includes('avatar') ||
          error.message.includes('bio')
        ) {
          return AccountProfileController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      return AccountProfileController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Update profile failed',
      });
    }
  }

  /**
   * 获取账户资料
   * @route GET /api/accounts/:accountUuid/profile
   * @description 获取账户的个人资料信息
   */
  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = req.params.accountUuid;
      logger.info('[AccountProfileController] Get profile request received', {
        accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = getProfileSchema.parse({ accountUuid });

      // ===== 步骤 2: 调用 ApplicationService 获取账户 =====
      const service = await AccountProfileController.getProfileService();
      const account = await service.getProfile(validatedData.accountUuid);

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AccountProfileController] Profile retrieved successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return AccountProfileController.responseBuilder.sendSuccess(
        res,
        {
          account,
        },
        'Profile retrieved successfully',
        200,
      );
    } catch (error) {
      logger.error('[AccountProfileController] Get profile failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AccountProfileController.responseBuilder.sendError(res, {
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
          return AccountProfileController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Account not found',
          });
        }
      }

      return AccountProfileController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Get profile failed',
      });
    }
  }
}


