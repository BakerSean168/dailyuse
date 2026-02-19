/**
 * Authentication Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  LoginByEmailSchema,
  RegisterByEmailSchema,
  RefreshTokenSchema,
} from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { AuthenticationRouteHandlers } from './routes';

export class AuthenticationController {
  constructor(private readonly handlers: AuthenticationRouteHandlers) {}

  async register(input: unknown, cx: Context): Promise<Result<unknown>> {
    const parsed = RegisterByEmailSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.register(parsed.data, cx);
    return ok(data);
  }

  async login(input: unknown, cx: Context): Promise<Result<unknown>> {
    const parsed = LoginByEmailSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.login(parsed.data, cx);
    return ok(data);
  }

  async logout(cx: Context): Promise<Result<unknown>> {
    await this.handlers.logout({}, cx);
    return ok(null);
  }

  async refreshToken(input: unknown, cx: Context): Promise<Result<unknown>> {
    const parsed = RefreshTokenSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.refreshToken(parsed.data, cx);
    return ok(data);
  }
}
