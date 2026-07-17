import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  RegisterByEmailReq,
  RegisterByEmailRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
  SendSmsCodeReq,
  RefreshTokenReq,
  RefreshTokenRes,
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  OAuthCallbackReq,
  OAuthCallbackRes,
} from '@dailyuse/contracts/authentication';

export interface AuthenticationApplicationPort {
  /**
   * Complete a pluggable OAuth login (e.g. GitHub) and issue a session.
   * 完成可插拔 OAuth 登录（如 GitHub）并签发会话。
   *
   * Dispatches to the registered provider for `data.provider`. Returns
   * SERVICE_UNAVAILABLE when that provider is not configured in this runtime.
   * 按 `data.provider` 分发到已注册提供者；该运行时未配置时返回 SERVICE_UNAVAILABLE。
   */
  oauthCallback(
    data: OAuthCallbackReq,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<OAuthCallbackRes>>;
  register(
    data: RegisterByEmailReq,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(data: RegisterByPhoneReq, cx: ExecutionContext): Promise<Result<RegisterByPhoneRes>>;
  login(
    data: LoginByEmailReq,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<LoginByEmailRes>>;
  loginByPhone(data: LoginByPhoneReq, cx: ExecutionContext): Promise<Result<LoginByPhoneRes>>;
  sendSmsCode(data: SendSmsCodeReq): Promise<Result<void>>;
  logout(cx: ExecutionContext): Promise<Result<void>>;
  refreshToken(data: RefreshTokenReq, cx: ExecutionContext): Promise<Result<RefreshTokenRes>>;
  getCurrentUser(cx: ExecutionContext, sessionId?: string): Promise<Result<GetCurrentUserRes>>;
  listSessions(cx: ExecutionContext, sessionId?: string): Promise<Result<ListSessionsRes>>;
  revokeSession(data: RevokeSessionReq, cx: ExecutionContext): Promise<Result<void>>;
  changePassword(data: ChangePasswordReq, cx: ExecutionContext): Promise<Result<void>>;
  forgotPassword(data: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(data: ResetPasswordReq): Promise<Result<void>>;
}
