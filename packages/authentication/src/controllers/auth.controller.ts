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
} from '@dailyuse/contracts/authentication';
import type {
  ChangePasswordReq,
  ForgotPasswordReq,
  GetCurrentUserRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
  ListSessionsRes,
  RevokeSessionReq,
  RefreshTokenReq,
  RefreshTokenRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  ResetPasswordReq,
  SendSmsCodeReq,
} from '@dailyuse/contracts/authentication';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface AuthenticationUseCases {
  register(data: RegisterByEmailReq, cx: Context, deviceId: string): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(data: RegisterByPhoneReq, cx: Context): Promise<Result<RegisterByPhoneRes>>;
  login(data: LoginByEmailReq, cx: Context, deviceId: string): Promise<Result<LoginByEmailRes>>;
  loginByPhone(data: LoginByPhoneReq, cx: Context): Promise<Result<LoginByPhoneRes>>;
  sendSmsCode(data: SendSmsCodeReq): Promise<Result<void>>;
  logout(cx: Context): Promise<Result<void>>;
  refreshToken(data: RefreshTokenReq, cx: Context): Promise<Result<RefreshTokenRes>>;
  getCurrentUser(cx: Context, sessionId?: string): Promise<Result<GetCurrentUserRes>>;
  listSessions(cx: Context, sessionId?: string): Promise<Result<ListSessionsRes>>;
  revokeSession(data: RevokeSessionReq, cx: Context): Promise<Result<void>>;
  changePassword(data: ChangePasswordReq, cx: Context): Promise<Result<void>>;
  forgotPassword(data: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(data: ResetPasswordReq): Promise<Result<void>>;
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
    return this.useCases.register(parsed.data, cx, cx.deviceId);
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
    return this.useCases.registerByPhone(parsed.data, cx);
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
    return this.useCases.login(parsed.data, cx, cx.deviceId);
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
    return this.useCases.loginByPhone(parsed.data, cx);
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
    return this.useCases.sendSmsCode(parsed.data);
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

  async getCurrentUser(cx: Context, sessionId?: string): Promise<Result<GetCurrentUserRes>> {
    return this.useCases.getCurrentUser(cx, sessionId);
  }

  async listSessions(cx: Context, sessionId?: string): Promise<Result<ListSessionsRes>> {
    return this.useCases.listSessions(cx, sessionId);
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
    return this.useCases.revokeSession(parsed.data, cx);
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
    return this.useCases.changePassword(parsed.data, cx);
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
    return this.useCases.forgotPassword(parsed.data);
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
    return this.useCases.resetPassword(parsed.data);
  }
}
