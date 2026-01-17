/**
 * API Key Controller
 * API密钥管理控制器
 *
 * 职责：
 * - 处理 API Key 相关的 HTTP 请求
 * - 输入验证
 * - 调用 ApiKeyApplicationService
 * - 响应格式化
 *
 * 遵循 DDD 架构最佳实践
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { 
  CreateApiKey,
  RevokeApiKey,
  ListApiKeys
} from '@dailyuse/application-server/authentication';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ApiKeyController');

// ==================== 输入验证 Schemas ====================

/**
 * 创建 API Key 请求验证
 */
const createApiKeySchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  name: z.string().min(1, 'API Key name is required').max(100, 'Name is too long'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required').optional().default([]),
  expiresInDays: z.number().positive('Expiration days must be positive').optional(),
});

/**
 * 验证 API Key 请求验证
 */
const validateApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
});

/**
 * 撤销 API Key 请求验证
 */
const revokeApiKeySchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  apiKey: z.string().min(1, 'API Key is required'),
});

/**
 * 更新 API Key 权限请求验证
 */
const updateApiKeyScopesSchema = z.object({
  accountUuid: z.string().uuid('Invalid account UUID'),
  apiKey: z.string().min(1, 'API Key is required'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
});

/**
 * API Key Controller
 */
export class ApiKeyController {
  private static createApiKeyService: CreateApiKey | null = null;
  private static revokeApiKeyService: RevokeApiKey | null = null;
  private static listApiKeysService: ListApiKeys | null = null;
  private static responseBuilder = createResponseBuilder();

  private static getCreateApiKeyService(): CreateApiKey {
    if (!ApiKeyController.createApiKeyService) {
      ApiKeyController.createApiKeyService = CreateApiKey.getInstance();
    }
    return ApiKeyController.createApiKeyService;
  }

  private static getRevokeApiKeyService(): RevokeApiKey {
    if (!ApiKeyController.revokeApiKeyService) {
      ApiKeyController.revokeApiKeyService = RevokeApiKey.getInstance();
    }
    return ApiKeyController.revokeApiKeyService;
  }

  private static getListApiKeysService(): ListApiKeys {
    if (!ApiKeyController.listApiKeysService) {
      ApiKeyController.listApiKeysService = ListApiKeys.getInstance();
    }
    return ApiKeyController.listApiKeysService;
  }

  /**
   * 创建 API Key
   * @route POST /api/auth/api-keys
   * @description 为账户创建新的 API Key
   */
  static async createApiKey(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[ApiKeyController] Create API Key request received', {
        accountUuid: req.body.accountUuid,
        name: req.body.name,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = createApiKeySchema.parse(req.body);

      // ===== 步骤 2: 调用 CreateApiKey Use Case =====
      const createApiKeyService = ApiKeyController.getCreateApiKeyService();
      const result = await createApiKeyService.execute({
        accountUuid: validatedData.accountUuid,
        name: validatedData.name,
        scopes: validatedData.scopes,
        expiresInDays: validatedData.expiresInDays,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[ApiKeyController] API Key created successfully', {
        accountUuid: validatedData.accountUuid,
        name: validatedData.name,
      });

      return ApiKeyController.responseBuilder.sendSuccess(
        res,
        {
          apiKey: result.apiKey,
          name: result.name,
          scopes: result.scopes,
          expiresAt: result.expiresAt,
          message: result.message,
        },
        'API Key created successfully',
        201,
      );
    } catch (error) {
      logger.error('[ApiKeyController] Create API Key failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return ApiKeyController.responseBuilder.sendError(res, {
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
        // 凭证未找到
        if (error.message.includes('not found')) {
          return ApiKeyController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Credential not found',
          });
        }

        // API Key 数量限制
        if (error.message.includes('limit') || error.message.includes('maximum')) {
          return ApiKeyController.responseBuilder.sendError(res, {
            code: ResponseCode.BAD_REQUEST,
            message: 'API Key limit reached',
          });
        }
      }

      return ApiKeyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Create API Key failed',
      });
    }
  }

  /**
   * 验证 API Key
   * @route POST /api/auth/api-keys/validate
   * @description 验证 API Key 的有效性
   * @todo 等待 packages 中实现 ValidateApiKey use case
   */
  // static async validateApiKey(req: Request, res: Response): Promise<Response> {
  //   try {
  //     logger.info('[ApiKeyController] Validate API Key request received');
  //     // TODO: 实现 ValidateApiKey use case
  //     return ApiKeyController.responseBuilder.sendSuccess(
  //       res,
  //       { isValid: false, message: 'Implementation pending' },
  //       'Not implemented',
  //     );
  //   } catch (error) {
  //     logger.error('[ApiKeyController] Validate API Key failed', {
  //       error: error instanceof Error ? error.message : String(error),
  //     });
  //     return ApiKeyController.responseBuilder.sendError(res, {
  //       code: ResponseCode.INTERNAL_ERROR,
  //       message: 'API Key validation failed',
  //     });
  //   }
  // }

  /**
   * 撤销 API Key
   * @route DELETE /api/auth/api-keys
   * @description 撤销指定的 API Key
   */
  static async revokeApiKey(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[ApiKeyController] Revoke API Key request received', {
        accountUuid: req.body.accountUuid,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = revokeApiKeySchema.parse(req.body);

      // ===== 步骤 2: 调用 RevokeApiKey Use Case =====
      const revokeApiKeyService = ApiKeyController.getRevokeApiKeyService();
      await revokeApiKeyService.execute({
        accountUuid: validatedData.accountUuid,
        apiKey: validatedData.apiKey,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[ApiKeyController] API Key revoked successfully', {
        accountUuid: validatedData.accountUuid,
      });

      return ApiKeyController.responseBuilder.sendSuccess(
        res,
        {
          message: 'API Key revoked successfully',
        },
        'API Key revoked successfully',
        200,
      );
    } catch (error) {
      logger.error('[ApiKeyController] Revoke API Key failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return ApiKeyController.responseBuilder.sendError(res, {
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
        // 凭证未找到
        if (error.message.includes('Credential not found')) {
          return ApiKeyController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'Credential not found',
          });
        }

        // API Key 未找到
        if (error.message.includes('API key not found')) {
          return ApiKeyController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: 'API Key not found',
          });
        }
      }

      return ApiKeyController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Revoke API Key failed',
      });
    }
  }

  /**
   * 更新 API Key 权限
   * @route PATCH /api/auth/api-keys/scopes
   * @description 更新 API Key 的访问权限
   * @todo 等待 packages 中实现 UpdateApiKeyScopes use case
   */
  // static async updateApiKeyScopes(req: Request, res: Response): Promise<Response> {
  //   try {
  //     logger.info('[ApiKeyController] Update API Key scopes request received');
  //     // TODO: 实现 UpdateApiKeyScopes use case
  //     return ApiKeyController.responseBuilder.sendSuccess(
  //       res,
  //       { message: 'Implementation pending' },
  //       'Not implemented',
  //     );
  //   } catch (error) {
  //     logger.error('[ApiKeyController] Update API Key scopes failed');
  //     return ApiKeyController.responseBuilder.sendError(res, {
  //       code: ResponseCode.INTERNAL_ERROR,
  //       message: 'Update API Key scopes failed',
  //     });
  //   }
  // }
}


