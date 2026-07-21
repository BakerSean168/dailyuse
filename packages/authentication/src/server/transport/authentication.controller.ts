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
  RevokeSessionSchema,
  ResetPasswordSchema,
  SendEmailCodeSchema,
  VerifyEmailCodeSchema,
  RegisterByEmailSchema,
  RefreshTokenSchema,
  OAuthCallbackSchema,
  GetOAuthUrlSchema,
  BindOAuthSchema,
  UnbindOAuthSchema,
} from '@dailyuse/contracts/authentication';
import type {
  GetCurrentUserRes,
  RegisterByEmailRes,
  LoginByEmailRes,
  ListSessionsRes,
  RefreshTokenRes,
  OAuthCallbackRes,
  GetOAuthUrlRes,
  OAuthProvidersRes,
  BindOAuthRes,
  VerifyEmailCodeRes,
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


  async getOAuthUrl(input: unknown): Promise<Result<GetOAuthUrlRes>> {
    const parsed = GetOAuthUrlSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: parsed.error.message,
      });
    }
    return this.api.getOAuthUrl(parsed.data);
  }

  async listOAuthProviders(): Promise<Result<OAuthProvidersRes>> {
    return this.api.listOAuthProviders();
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

  async bindOAuth(input: unknown, cx: Context): Promise<Result<BindOAuthRes>> {
    const parsed = BindOAuthSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.bindOAuth(parsed.data, cx);
  }

  async unbindOAuth(input: unknown, cx: Context): Promise<Result<void>> {
    const parsed = UnbindOAuthSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.unbindOAuth(parsed.data, cx);
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

  async sendEmailCode(input: unknown, cx?: Context): Promise<Result<void>> {
    const parsed = SendEmailCodeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.sendEmailCode(parsed.data, cx);
  }

  async verifyEmailCode(input: unknown, cx?: Context): Promise<Result<VerifyEmailCodeRes>> {
    const parsed = VerifyEmailCodeSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.verifyEmailCode(parsed.data, cx);
  }
}
