/**
 * Auth IPC Adapter
 *
 * IPC implementation of IAuthApiClient for Electron desktop apps.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IAuthApiClient, IResultIpcClient } from '../types';
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
} from '@dailyuse/contracts/authentication';

const CHANNELS = {
  LOGIN_EMAIL: 'auth:login',
  LOGIN_PHONE: 'auth:login',
  REGISTER_EMAIL: 'auth:register',
  REGISTER_PHONE: 'auth:register',
  SEND_SMS: 'auth:send-sms-code',
  REFRESH_TOKEN: 'auth:refresh-token',
  LOGOUT: 'auth:logout',
  GET_CURRENT_USER: 'auth:get-status',
  LIST_SESSIONS: 'auth:session:list',
  REVOKE_SESSION: 'auth:session:revoke',
  CHANGE_PASSWORD: 'auth:change-password',
  FORGOT_PASSWORD: 'auth:forgot-password',
  RESET_PASSWORD: 'auth:reset-password',
  ENTER_GUEST_MODE: 'auth:enter-guest-mode',
} as const;

export class AuthIpcAdapter implements IAuthApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.ipcClient.invoke(CHANNELS.LOGIN_EMAIL, req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>> {
    return this.ipcClient.invoke(CHANNELS.LOGIN_PHONE, req);
  }

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.ipcClient.invoke(CHANNELS.REGISTER_EMAIL, req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>> {
    return this.ipcClient.invoke(CHANNELS.REGISTER_PHONE, req);
  }

  async sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.SEND_SMS, req);
  }

  async refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>> {
    return this.ipcClient.invoke(CHANNELS.REFRESH_TOKEN, req);
  }

  async logout(): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.LOGOUT);
  }

  async getCurrentUser(): Promise<Result<GetCurrentUserRes>> {
    return this.ipcClient.invoke(CHANNELS.GET_CURRENT_USER);
  }

  async listSessions(): Promise<Result<ListSessionsRes>> {
    return this.ipcClient.invoke(CHANNELS.LIST_SESSIONS);
  }

  async revokeSession(req: RevokeSessionReq): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.REVOKE_SESSION, req);
  }

  async changePassword(req: ChangePasswordReq): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.CHANGE_PASSWORD, req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.FORGOT_PASSWORD, req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.RESET_PASSWORD, req);
  }

  async enterGuestMode(): Promise<Result<GuestModeRes>> {
    return this.ipcClient.invoke(CHANNELS.ENTER_GUEST_MODE);
  }
}

export function createAuthIpcAdapter(ipcClient: IResultIpcClient): IAuthApiClient {
  return new AuthIpcAdapter(ipcClient);
}
