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
} from '@dailyuse/contracts/authentication';

export class AuthClientService {
  constructor(private readonly apiClient: IAuthApiClient) {}

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
}
