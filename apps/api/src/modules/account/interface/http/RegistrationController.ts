import type { Request, Response } from 'express';
import { z } from 'zod';
import { RegistrationApplicationService } from '@dailyuse/application-server/account';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RegistrationController');

// ==================== 输入验证 Schemas ====================

/**
 * 用户注册请求验证
 */
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  profile: z
    .object({
      displayName: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

/**
 * Registration Controller
 * 处理用户注册相关的 HTTP 请求
 */
export class RegistrationController {
  private static registrationService: RegistrationApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取注册服务实例（懒加载）
   */
  private static async getRegistrationService(): Promise<RegistrationApplicationService> {
    if (!RegistrationController.registrationService) {
      RegistrationController.registrationService =
        await RegistrationApplicationService.getInstance();
    }
    return RegistrationController.registrationService;
  }

  /**
   * 用户注册
   * @route POST /api/auth/register
   * @description 注册新用户账户
   */
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[RegistrationController] Registration request received', {
        username: req.body.username,
        email: req.body.email,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = registerSchema.parse(req.body);

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await RegistrationController.getRegistrationService();
      const result = await service.registerUser({
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password,
        profile: validatedData.profile || {},
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[RegistrationController] User registered successfully', {
        accountUuid: result.account.uuid,
        username: validatedData.username,
      });

      // ⚠️ 注意：前端期望注册接口返回完整的登录响应（包含 token）
      // 但当前实现采用事件驱动架构，Credential 由 AccountCreatedHandler 异步创建
      // 因此这里只返回 account 信息，前端需要在注册成功后调用登录接口
      return RegistrationController.responseBuilder.sendSuccess(
        res,
        {
          account: result.account,
        },
        'Registration successful. Please log in to continue.',
        201,
      );
    } catch (error) {
      logger.error('[RegistrationController] Registration failed', {
        error: error instanceof Error ? error.message : String(error),
        username: req.body.username,
        email: req.body.email,
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return RegistrationController.responseBuilder.sendError(res, {
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
        // 用户名已存在
        if (error.message.includes('Username already exists')) {
          return RegistrationController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: 'Username already exists',
          });
        }

        // 邮箱已存在
        if (error.message.includes('Email already exists')) {
          return RegistrationController.responseBuilder.sendError(res, {
            code: ResponseCode.CONFLICT,
            message: 'Email already exists',
          });
        }

        // 领域验证错误
        if (
          error.message.includes('Username must be') ||
          error.message.includes('Invalid email format') ||
          error.message.includes('Password must be')
        ) {
          return RegistrationController.responseBuilder.sendError(res, {
            code: ResponseCode.VALIDATION_ERROR,
            message: error.message,
          });
        }
      }

      // 通用错误
      return RegistrationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Registration failed',
      });
    }
  }
}


