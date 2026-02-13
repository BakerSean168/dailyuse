/**
 * Auth HTTP Adapter
 *
 * HTTP implementation of IAuthApiClient.
 * Token 注入由外部 httpClient 负责（拦截器自动添加 Authorization Header）。
 */

import type { IAuthApiClient, IHttpClient } from '../types';
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

export class AuthHttpAdapter implements IAuthApiClient {
  private readonly baseUrl = '/auth';

  constructor(private readonly httpClient: IHttpClient) {}

  // ========== Login ==========

  async loginByEmail(req: LoginByEmailReq): Promise<LoginByEmailRes> {
    return this.httpClient.post(`${this.baseUrl}/login`, req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<LoginByPhoneRes> {
    return this.httpClient.post(`${this.baseUrl}/login/phone`, req);
  }

  // ========== Register ==========

  async registerByEmail(req: RegisterByEmailReq): Promise<RegisterByEmailRes> {
    return this.httpClient.post(`${this.baseUrl}/register`, req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<RegisterByPhoneRes> {
    return this.httpClient.post(`${this.baseUrl}/register/phone`, req);
  }

  // ========== SMS ==========

  async sendSmsCode(req: SendSmsCodeReq): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/sms/send`, req);
  }

  // ========== Token ==========

  async refreshToken(req: RefreshTokenReq): Promise<RefreshTokenRes> {
    return this.httpClient.post(`${this.baseUrl}/refresh`, req);
  }

  // ========== Session ==========

  async logout(): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/logout`);
  }

  async getCurrentUser(): Promise<GetCurrentUserRes> {
    return this.httpClient.get(`${this.baseUrl}/me`);
  }

  async listSessions(): Promise<ListSessionsRes> {
    return this.httpClient.get(`${this.baseUrl}/sessions`);
  }

  async revokeSession(req: RevokeSessionReq): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/sessions/revoke`, req);
  }

  // ========== Password ==========

  async changePassword(req: ChangePasswordReq): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/password/change`, req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/password/forgot`, req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/password/reset`, req);
  }
}

export function createAuthHttpAdapter(httpClient: IHttpClient): IAuthApiClient {
  return new AuthHttpAdapter(httpClient);
}
