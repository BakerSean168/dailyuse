/**
 * Authentication API Client Port Interface
 * 认证 API 客户端接口
 *
 * 定义客户端认证模块所有 API 操作的契约。
 * 实现：AuthHttpAdapter (web), AuthIpcAdapter (desktop)
 *
 * 所有方法返回 Promise<Result<T>>，统一错误处理。
 */

import type { Result } from '@memoflow/contracts/result';
import type {
  AutoLoginResult,
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
  RefreshTokenReq,
  RefreshTokenRes,
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
  SendEmailCodeReq,
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
  GetOAuthUrlReq,
  GetOAuthUrlRes,
  OAuthProvidersRes,
  OAuthCallbackReq,
  OAuthCallbackRes,
  BindOAuthReq,
  BindOAuthRes,
  UnbindOAuthReq,
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  GuestModeRes,
  RememberedDesktopAccountDTO,
  RememberedDesktopAccountLoginReq,
} from '@memoflow/contracts/authentication';

/**
 * Authentication API Client Interface
 */
export interface IAuthApiClient {
  // ========== Login ==========
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>>;

  // ========== Register ==========
  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>>;

  // ========== SMS ==========

  // ========== Token ==========
  refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>>;

  // ========== Session ==========
  logout(): Promise<Result<void>>;
  getCurrentUser(): Promise<Result<GetCurrentUserRes>>;
  listSessions(): Promise<Result<ListSessionsRes>>;
  revokeSession(req: RevokeSessionReq): Promise<Result<void>>;

  // ========== Password ==========
  changePassword(req: ChangePasswordReq): Promise<Result<void>>;
  forgotPassword(req: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(req: ResetPasswordReq): Promise<Result<void>>;

  // ========== Email verification ==========
  sendEmailCode(req: SendEmailCodeReq): Promise<Result<void>>;
  verifyEmailCode(req: VerifyEmailCodeReq): Promise<Result<VerifyEmailCodeRes>>;
  getOAuthUrl(req: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>>;
  listOAuthProviders(): Promise<Result<OAuthProvidersRes>>;
  oauthCallback(req: OAuthCallbackReq): Promise<Result<OAuthCallbackRes>>;
  bindOAuth(req: BindOAuthReq): Promise<Result<BindOAuthRes>>;
  unbindOAuth(req: UnbindOAuthReq): Promise<Result<void>>;

  // ========== Guest Mode (Desktop) ==========
  enterGuestMode(): Promise<Result<GuestModeRes>>;
  autoLoginDesktop(): Promise<Result<AutoLoginResult>>;
  listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>>;
  loginRememberedDesktopAccount(req: RememberedDesktopAccountLoginReq): Promise<Result<LoginByEmailRes>>;
  removeRememberedAccount(identityId: string): Promise<Result<void>>;
}
