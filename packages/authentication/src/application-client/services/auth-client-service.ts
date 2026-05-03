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
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  SendSmsCodeReq,
  RefreshTokenReq,
  RefreshTokenRes,
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  GuestModeRes,
  RememberedDesktopAccountDTO,
} from '@dailyuse/contracts/authentication';

// ─── Client Application Port ────────────────────────────────────────────────

/** High-level client-side operations for the authentication module. */
export interface AuthenticationClientPort {
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>>;
  loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>>;
  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>>;
  sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>>;
  refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>>;
  logout(): Promise<Result<void>>;
  getCurrentUser(): Promise<Result<GetCurrentUserRes>>;
  listSessions(): Promise<Result<ListSessionsRes>>;
  revokeSession(req: RevokeSessionReq): Promise<Result<void>>;
  changePassword(req: ChangePasswordReq): Promise<Result<void>>;
  forgotPassword(req: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(req: ResetPasswordReq): Promise<Result<void>>;
  enterGuestMode(): Promise<Result<GuestModeRes>>;
  listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>>;
  removeRememberedAccount(identityId: string): Promise<Result<void>>;
}

export class AuthClientService implements AuthenticationClientPort {
  constructor(private readonly apiClient: IAuthApiClient) {
    this.loginByEmail = this.loginByEmail.bind(this);
    this.loginByPhone = this.loginByPhone.bind(this);
    this.registerByEmail = this.registerByEmail.bind(this);
    this.registerByPhone = this.registerByPhone.bind(this);
    this.sendSmsCode = this.sendSmsCode.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.listSessions = this.listSessions.bind(this);
    this.revokeSession = this.revokeSession.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.enterGuestMode = this.enterGuestMode.bind(this);
    this.listRememberedAccounts = this.listRememberedAccounts.bind(this);
    this.removeRememberedAccount = this.removeRememberedAccount.bind(this);
  }

  // ========== Login ==========

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.apiClient.loginByEmail(req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>> {
    return this.apiClient.loginByPhone(req);
  }

  // ========== Register ==========

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.apiClient.registerByEmail(req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>> {
    return this.apiClient.registerByPhone(req);
  }

  // ========== SMS ==========

  async sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>> {
    return this.apiClient.sendSmsCode(req);
  }

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

  // ========== Guest Mode (Desktop) ==========

  async enterGuestMode(): Promise<Result<GuestModeRes>> {
    return this.apiClient.enterGuestMode();
  }

  async listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>> {
    return this.apiClient.listRememberedAccounts();
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
