/**
 * Auth IPC Adapter
 *
 * IPC implementation of IAuthApiClient for Electron desktop apps.
 * 所有方法返回 Promise<Result<T>>，使用 tryCatch 包装 IPC 调用。
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type { IAuthApiClient, IIpcClient } from '../types';
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

const CHANNELS = {
  LOGIN_EMAIL: 'auth:login-email',
  LOGIN_PHONE: 'auth:login-phone',
  REGISTER_EMAIL: 'auth:register-email',
  REGISTER_PHONE: 'auth:register-phone',
  SEND_SMS: 'auth:send-sms-code',
  REFRESH_TOKEN: 'auth:refresh-token',
  LOGOUT: 'auth:logout',
  GET_CURRENT_USER: 'auth:me',
  LIST_SESSIONS: 'auth:sessions:list',
  REVOKE_SESSION: 'auth:sessions:revoke',
  CHANGE_PASSWORD: 'auth:password:change',
  FORGOT_PASSWORD: 'auth:password:forgot',
  RESET_PASSWORD: 'auth:password:reset',
} as const;

export class AuthIpcAdapter implements IAuthApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return tryCatch(() => this.ipcClient.invoke<LoginByEmailRes>(CHANNELS.LOGIN_EMAIL, req));
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>> {
    return tryCatch(() => this.ipcClient.invoke<LoginByPhoneRes>(CHANNELS.LOGIN_PHONE, req));
  }

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return tryCatch(() => this.ipcClient.invoke<RegisterByEmailRes>(CHANNELS.REGISTER_EMAIL, req));
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>> {
    return tryCatch(() => this.ipcClient.invoke<RegisterByPhoneRes>(CHANNELS.REGISTER_PHONE, req));
  }

  async sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.SEND_SMS, req));
  }

  async refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>> {
    return tryCatch(() => this.ipcClient.invoke<RefreshTokenRes>(CHANNELS.REFRESH_TOKEN, req));
  }

  async logout(): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.LOGOUT));
  }

  async getCurrentUser(): Promise<Result<GetCurrentUserRes>> {
    return tryCatch(() => this.ipcClient.invoke<GetCurrentUserRes>(CHANNELS.GET_CURRENT_USER));
  }

  async listSessions(): Promise<Result<ListSessionsRes>> {
    return tryCatch(() => this.ipcClient.invoke<ListSessionsRes>(CHANNELS.LIST_SESSIONS));
  }

  async revokeSession(req: RevokeSessionReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.REVOKE_SESSION, req));
  }

  async changePassword(req: ChangePasswordReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.CHANGE_PASSWORD, req));
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.FORGOT_PASSWORD, req));
  }

  async resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.RESET_PASSWORD, req));
  }
}

export function createAuthIpcAdapter(ipcClient: IIpcClient): IAuthApiClient {
  return new AuthIpcAdapter(ipcClient);
}
