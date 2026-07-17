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
import type { AuthenticationApplicationPort } from '../application';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginByEmailSchema,
  LoginByPhoneSchema,
  RevokeSessionSchema,
  ResetPasswordSchema,
  RegisterByEmailSchema,
  RegisterByPhoneSchema,
  RefreshTokenSchema,
  SendSmsCodeSchema,
  OAuthCallbackSchema,
} from '@dailyuse/contracts/authentication';
import type {
  GetCurrentUserRes,
  RegisterByEmailRes,
  LoginByEmailRes,
  LoginByPhoneRes,
  ListSessionsRes,
  RefreshTokenRes,
  RegisterByPhoneRes,
  OAuthCallbackRes,
} from '@dailyuse/contracts/authentication';
import { formatZodErrors } from '@dailyuse/utils/result';

export class AuthenticationController {
  constructor(private readonly api: AuthenticationApplicationPort) {}

  async register(input: unknown, cx: Context): Promise<Result<RegisterByEmailRes>> {
    const parsed = RegisterByEmailSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.register(parsed.data, cx, cx.deviceId);
  }

  async registerByPhone(input: unknown, cx: Context): Promise<Result<RegisterByPhoneRes>> {
    const parsed = RegisterByPhoneSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.registerByPhone(parsed.data, cx);
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
    return this.api.login(parsed.data, cx, cx.deviceId);
  }

  async loginByPhone(input: unknown, cx: Context): Promise<Result<LoginByPhoneRes>> {
    const parsed = LoginByPhoneSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.loginByPhone(parsed.data, cx);
  }

  async oauthCallback(input: unknown, cx: Context): Promise<Result<OAuthCallbackRes>> {
    const parsed = OAuthCallbackSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.oauthCallback(parsed.data, cx, cx.deviceId);
  }

  async sendSmsCode(input: unknown): Promise<Result<void>> {
    const parsed = SendSmsCodeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.sendSmsCode(parsed.data);
  }

  async logout(cx: Context): Promise<Result<void>> {
    return this.api.logout(cx);
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
    return this.api.refreshToken(parsed.data, cx);
  }

  async getCurrentUser(cx: Context, sessionId?: string): Promise<Result<GetCurrentUserRes>> {
    return this.api.getCurrentUser(cx, sessionId);
  }

  async listSessions(cx: Context, sessionId?: string): Promise<Result<ListSessionsRes>> {
    return this.api.listSessions(cx, sessionId);
  }

  async revokeSession(input: unknown, cx: Context): Promise<Result<void>> {
    const parsed = RevokeSessionSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.revokeSession(parsed.data, cx);
  }

  async changePassword(input: unknown, cx: Context): Promise<Result<void>> {
    const parsed = ChangePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.changePassword(parsed.data, cx);
  }

  async forgotPassword(input: unknown): Promise<Result<void>> {
    const parsed = ForgotPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.forgotPassword(parsed.data);
  }

  async resetPassword(input: unknown): Promise<Result<void>> {
    const parsed = ResetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.resetPassword(parsed.data);
  }
}
