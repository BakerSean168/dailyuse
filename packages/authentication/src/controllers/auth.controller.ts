/**
 * Authentication Controller
 *
 * Transport-agnostic controller for authentication operations.
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  LoginByEmailSchema,
  RegisterByEmailSchema,
  RefreshTokenSchema,
} from '@dailyuse/contracts/authentication';
import type {
  RegisterByEmailReq,
  RegisterByEmailRes,
  LoginByEmailReq,
  LoginByEmailRes,
  RefreshTokenReq,
  RefreshTokenRes,
} from '@dailyuse/contracts/authentication';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface AuthenticationUseCases {
  register(data: RegisterByEmailReq, cx: Context): Promise<Result<RegisterByEmailRes>>;
  login(data: LoginByEmailReq, cx: Context): Promise<Result<LoginByEmailRes>>;
  logout(cx: Context): Promise<Result<void>>;
  refreshToken(data: RefreshTokenReq, cx: Context): Promise<Result<RefreshTokenRes>>;
}

// ============ Controller ============

export class AuthenticationController {
  constructor(private readonly useCases: AuthenticationUseCases) {}

  async register(input: unknown, cx: Context): Promise<Result<RegisterByEmailRes>> {
    const parsed = RegisterByEmailSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.register(parsed.data, cx);
  }

  async login(input: unknown, cx: Context): Promise<Result<LoginByEmailRes>> {
    const parsed = LoginByEmailSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.login(parsed.data, cx);
  }

  async logout(cx: Context): Promise<Result<void>> {
    return this.useCases.logout(cx);
  }

  async refreshToken(input: unknown, cx: Context): Promise<Result<RefreshTokenRes>> {
    const parsed = RefreshTokenSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.refreshToken(parsed.data, cx);
  }
}
