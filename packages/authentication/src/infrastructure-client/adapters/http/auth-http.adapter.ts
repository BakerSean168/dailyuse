/**
 * Auth HTTP Adapter
 *
 * HTTP implementation of IAuthApiClient.
 * Uses IResultHttpClient — all methods return Result<T>, never throw.
 * Token 注入由外部 httpClient 负责（拦截器自动添加 Authorization Header）。
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { IAuthApiClient } from '../types';
import type { IResultHttpClient } from '@dailyuse/http-client';
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

export class AuthHttpAdapter implements IAuthApiClient {
  private readonly baseUrl = '/auth';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ========== Login ==========

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.httpClient.post(`${this.baseUrl}/login`, req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>> {
    return this.httpClient.post(`${this.baseUrl}/login/phone`, req);
  }

  // ========== Register ==========

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.httpClient.post(`${this.baseUrl}/register`, req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>> {
    return this.httpClient.post(`${this.baseUrl}/register/phone`, req);
  }

  // ========== SMS ==========

  async sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/sms/send`, req);
  }

  // ========== Token ==========

  async refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>> {
    return this.httpClient.post(`${this.baseUrl}/refresh`, req);
  }

  // ========== Session ==========

  async logout(): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/logout`);
  }

  async getCurrentUser(): Promise<Result<GetCurrentUserRes>> {
    return this.httpClient.get(`${this.baseUrl}/me`);
  }

  async listSessions(): Promise<Result<ListSessionsRes>> {
    return this.httpClient.get(`${this.baseUrl}/sessions`);
  }

  async revokeSession(req: RevokeSessionReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/sessions/revoke`, req);
  }

  // ========== Password ==========

  async changePassword(req: ChangePasswordReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/password/change`, req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/password/forgot`, req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/password/reset`, req);
  }

  async enterGuestMode(): Promise<Result<GuestModeRes>> {
    return fail({ code: 'NOT_SUPPORTED', message: 'Guest mode is only available on desktop' });
  }

  async listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>> {
    return fail({
      code: 'NOT_SUPPORTED',
      message: 'Remembered accounts are only available on desktop',
    });
  }

  async removeRememberedAccount(): Promise<Result<void>> {
    return fail({
      code: 'NOT_SUPPORTED',
      message: 'Remembered accounts are only available on desktop',
    });
  }
}

export function createAuthHttpAdapter(httpClient: IResultHttpClient): IAuthApiClient {
  return new AuthHttpAdapter(httpClient);
}
