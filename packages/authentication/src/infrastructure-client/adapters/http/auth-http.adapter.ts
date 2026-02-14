/**
 * Auth HTTP Adapter
 *
 * HTTP implementation of IAuthApiClient.
 * 使用 IResultHttpClient，所有方法返回 Promise<Result<T>>。
 * Token 注入由外部 httpClient 负责（拦截器自动添加 Authorization Header）。
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IAuthApiClient, IResultHttpClient } from '../types';
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

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ========== Login ==========

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.httpClient.post<LoginByEmailRes>(`${this.baseUrl}/login`, req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>> {
    return this.httpClient.post<LoginByPhoneRes>(`${this.baseUrl}/login/phone`, req);
  }

  // ========== Register ==========

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.httpClient.post<RegisterByEmailRes>(`${this.baseUrl}/register`, req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>> {
    return this.httpClient.post<RegisterByPhoneRes>(`${this.baseUrl}/register/phone`, req);
  }

  // ========== SMS ==========

  async sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/sms/send`, req);
  }

  // ========== Token ==========

  async refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>> {
    return this.httpClient.post<RefreshTokenRes>(`${this.baseUrl}/refresh`, req);
  }

  // ========== Session ==========

  async logout(): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/logout`);
  }

  async getCurrentUser(): Promise<Result<GetCurrentUserRes>> {
    return this.httpClient.get<GetCurrentUserRes>(`${this.baseUrl}/me`);
  }

  async listSessions(): Promise<Result<ListSessionsRes>> {
    return this.httpClient.get<ListSessionsRes>(`${this.baseUrl}/sessions`);
  }

  async revokeSession(req: RevokeSessionReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/sessions/revoke`, req);
  }

  // ========== Password ==========

  async changePassword(req: ChangePasswordReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/password/change`, req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/password/forgot`, req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/password/reset`, req);
  }
}

export function createAuthHttpAdapter(httpClient: IResultHttpClient): IAuthApiClient {
  return new AuthHttpAdapter(httpClient);
}
