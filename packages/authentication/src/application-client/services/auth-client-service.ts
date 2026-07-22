/**
 * Auth Client Service
 * 客户端认证应用服务 — 协调 API 调用
 *
 * 框架无关的纯 TypeScript 类，
 * 可在 Vue / React / Electron 中复用。
 *
 * 所有方法返回 Result<T>，由 Composable 层处理成功/失败。
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IAuthApiClient } from '../ports/auth-api-client.port';
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
} from '@dailyuse/contracts/authentication';

// ─── Client Application Port ────────────────────────────────────────────────

/**
 * Application-facing client port.
 * Identical to IAuthApiClient for this module (pure Result pass-through).
 */
export type AuthenticationClientPort = IAuthApiClient;

export class AuthClientService implements IAuthApiClient {

  constructor(private readonly apiClient: IAuthApiClient) {
    this.loginByEmail = this.loginByEmail.bind(this);
    this.registerByEmail = this.registerByEmail.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.listSessions = this.listSessions.bind(this);
    this.revokeSession = this.revokeSession.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.sendEmailCode = this.sendEmailCode.bind(this);
    this.verifyEmailCode = this.verifyEmailCode.bind(this);
    this.getOAuthUrl = this.getOAuthUrl.bind(this);
    this.listOAuthProviders = this.listOAuthProviders.bind(this);
    this.oauthCallback = this.oauthCallback.bind(this);
    this.bindOAuth = this.bindOAuth.bind(this);
    this.unbindOAuth = this.unbindOAuth.bind(this);
    this.enterGuestMode = this.enterGuestMode.bind(this);
    this.autoLoginDesktop = this.autoLoginDesktop.bind(this);
    this.listRememberedAccounts = this.listRememberedAccounts.bind(this);
    this.loginRememberedDesktopAccount = this.loginRememberedDesktopAccount.bind(this);
    this.removeRememberedAccount = this.removeRememberedAccount.bind(this);
  }

  // ========== Login ==========

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.apiClient.loginByEmail(req);
  }


  // ========== Register ==========

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.apiClient.registerByEmail(req);
  }


  // ========== SMS ==========


  // ========== Token ==========

  async refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>> {
    return this.apiClient.refreshToken(req);
  }

  // ========== Session ==========

  async logout(): Promise<Result<void>> {
    return this.apiClient.logout();
  }

  async getCurrentUser(): Promise<Result<GetCurrentUserRes>> {
    return this.apiClient.getCurrentUser();
  }

  async listSessions(): Promise<Result<ListSessionsRes>> {
    return this.apiClient.listSessions();
  }

  async revokeSession(req: RevokeSessionReq): Promise<Result<void>> {
    return this.apiClient.revokeSession(req);
  }

  // ========== Password ==========

  async changePassword(req: ChangePasswordReq): Promise<Result<void>> {
    return this.apiClient.changePassword(req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return this.apiClient.forgotPassword(req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return this.apiClient.resetPassword(req);
  }

  // ========== Email verification ==========

  async sendEmailCode(req: SendEmailCodeReq): Promise<Result<void>> {
    return this.apiClient.sendEmailCode(req);
  }

  async verifyEmailCode(req: VerifyEmailCodeReq): Promise<Result<VerifyEmailCodeRes>> {
    return this.apiClient.verifyEmailCode(req);
  }

  async getOAuthUrl(req: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>> {
    return this.apiClient.getOAuthUrl(req);
  }

  async listOAuthProviders(): Promise<Result<OAuthProvidersRes>> {
    return this.apiClient.listOAuthProviders();
  }

  async oauthCallback(req: OAuthCallbackReq): Promise<Result<OAuthCallbackRes>> {
    return this.apiClient.oauthCallback(req);
  }

  async bindOAuth(req: BindOAuthReq): Promise<Result<BindOAuthRes>> {
    return this.apiClient.bindOAuth(req);
  }

  async unbindOAuth(req: UnbindOAuthReq): Promise<Result<void>> {
    return this.apiClient.unbindOAuth(req);
  }

  // ========== Guest Mode (Desktop) ==========

  async enterGuestMode(): Promise<Result<GuestModeRes>> {
    return this.apiClient.enterGuestMode();
  }

  async autoLoginDesktop(): Promise<Result<AutoLoginResult>> {
    return this.apiClient.autoLoginDesktop();
  }

  async listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>> {
    return this.apiClient.listRememberedAccounts();
  }

  async loginRememberedDesktopAccount(
    req: RememberedDesktopAccountLoginReq,
  ): Promise<Result<LoginByEmailRes>> {
    return this.apiClient.loginRememberedDesktopAccount(req);
  }

  async removeRememberedAccount(identityId: string): Promise<Result<void>> {
    return this.apiClient.removeRememberedAccount(identityId);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create an `AuthClientService` from any transport adapter. */
export function createAuthenticationClientService(apiClient: IAuthApiClient): AuthClientService {
  return new AuthClientService(apiClient);
}
