/**
 * Auth IPC Adapter
 *
 * IPC implementation of IAuthApiClient for Electron desktop apps.
 */

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

  async loginByEmail(req: LoginByEmailReq): Promise<LoginByEmailRes> {
    return this.ipcClient.invoke(CHANNELS.LOGIN_EMAIL, req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<LoginByPhoneRes> {
    return this.ipcClient.invoke(CHANNELS.LOGIN_PHONE, req);
  }

  async registerByEmail(req: RegisterByEmailReq): Promise<RegisterByEmailRes> {
    return this.ipcClient.invoke(CHANNELS.REGISTER_EMAIL, req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<RegisterByPhoneRes> {
    return this.ipcClient.invoke(CHANNELS.REGISTER_PHONE, req);
  }

  async sendSmsCode(req: SendSmsCodeReq): Promise<void> {
    await this.ipcClient.invoke(CHANNELS.SEND_SMS, req);
  }

  async refreshToken(req: RefreshTokenReq): Promise<RefreshTokenRes> {
    return this.ipcClient.invoke(CHANNELS.REFRESH_TOKEN, req);
  }

  async logout(): Promise<void> {
    await this.ipcClient.invoke(CHANNELS.LOGOUT);
  }

  async getCurrentUser(): Promise<GetCurrentUserRes> {
    return this.ipcClient.invoke(CHANNELS.GET_CURRENT_USER);
  }

  async listSessions(): Promise<ListSessionsRes> {
    return this.ipcClient.invoke(CHANNELS.LIST_SESSIONS);
  }

  async revokeSession(req: RevokeSessionReq): Promise<void> {
    await this.ipcClient.invoke(CHANNELS.REVOKE_SESSION, req);
  }

  async changePassword(req: ChangePasswordReq): Promise<void> {
    await this.ipcClient.invoke(CHANNELS.CHANGE_PASSWORD, req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<void> {
    await this.ipcClient.invoke(CHANNELS.FORGOT_PASSWORD, req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<void> {
    await this.ipcClient.invoke(CHANNELS.RESET_PASSWORD, req);
  }
}

export function createAuthIpcAdapter(ipcClient: IIpcClient): IAuthApiClient {
  return new AuthIpcAdapter(ipcClient);
}
