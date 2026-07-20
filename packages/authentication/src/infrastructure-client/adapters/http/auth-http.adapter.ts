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
  AutoLoginResult,
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

  async sendEmailCode(req: SendEmailCodeReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/email/send-code`, req);
  }

  async verifyEmailCode(req: VerifyEmailCodeReq): Promise<Result<VerifyEmailCodeRes>> {
    return this.httpClient.post(`${this.baseUrl}/email/verify`, req);
  }

  async getOAuthUrl(req: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>> {
    return this.httpClient.post(`${this.baseUrl}/oauth/url`, req);
  }

  async listOAuthProviders(): Promise<Result<OAuthProvidersRes>> {
    return this.httpClient.get(`${this.baseUrl}/oauth/providers`);
  }

  async oauthCallback(req: OAuthCallbackReq): Promise<Result<OAuthCallbackRes>> {
    return this.httpClient.post(`${this.baseUrl}/oauth/callback`, req);
  }

  async bindOAuth(req: BindOAuthReq): Promise<Result<BindOAuthRes>> {
    return this.httpClient.post(`${this.baseUrl}/oauth/bind`, req);
  }

  async unbindOAuth(req: UnbindOAuthReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/oauth/unbind`, req);
  }

  async enterGuestMode(): Promise<Result<GuestModeRes>> {
    return fail({ code: 'NOT_SUPPORTED', message: 'Guest mode is only available on desktop' });
  }

  async autoLoginDesktop(): Promise<Result<AutoLoginResult>> {
    return fail({ code: 'NOT_SUPPORTED', message: 'Auto login is only available on desktop' });
  }

  async listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>> {
    return fail({
      code: 'NOT_SUPPORTED',
      message: 'Remembered accounts are only available on desktop',
    });
  }

  async loginRememberedDesktopAccount(
    req: RememberedDesktopAccountLoginReq,
  ): Promise<Result<LoginByEmailRes>> {
    void req;
    return fail({
      code: 'NOT_SUPPORTED',
      message: 'Remembered account login is only available on desktop',
    });
  }

  async removeRememberedAccount(identityId: string): Promise<Result<void>> {
    void identityId;
    return fail({
      code: 'NOT_SUPPORTED',
      message: 'Remembered accounts are only available on desktop',
    });
  }
}

export function createAuthHttpAdapter(httpClient: IResultHttpClient): IAuthApiClient {
  return new AuthHttpAdapter(httpClient);
}
