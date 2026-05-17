/**
 * Auth IPC Adapter
 *
 * IPC implementation of IAuthApiClient for Electron desktop apps.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import { AuthChannels } from '@dailyuse/contracts/electron';
import type { IAuthApiClient, IResultIpcClient } from '../types';
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
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  GuestModeRes,
  RememberedDesktopAccountDTO,
  RememberedDesktopAccountLoginReq,
} from '@dailyuse/contracts/authentication';

export class AuthIpcAdapter implements IAuthApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.ipcClient.invoke(AuthChannels.LOGIN, req);
  }

  async loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>> {
    return this.ipcClient.invoke(AuthChannels.LOGIN, req);
  }

  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.ipcClient.invoke(AuthChannels.REGISTER, req);
  }

  async registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>> {
    return this.ipcClient.invoke(AuthChannels.REGISTER, req);
  }

  async sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.SEND_SMS_CODE, req);
  }

  async refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>> {
    return this.ipcClient.invoke(AuthChannels.REFRESH_TOKEN, req);
  }

  async logout(): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.LOGOUT);
  }

  async getCurrentUser(): Promise<Result<GetCurrentUserRes>> {
    return this.ipcClient.invoke(AuthChannels.GET_CURRENT_USER);
  }

  async listSessions(): Promise<Result<ListSessionsRes>> {
    return this.ipcClient.invoke(AuthChannels.SESSION_LIST);
  }

  async revokeSession(req: RevokeSessionReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.SESSION_REVOKE, req);
  }

  async changePassword(req: ChangePasswordReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.CHANGE_PASSWORD, req);
  }

  async forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.FORGOT_PASSWORD, req);
  }

  async resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.RESET_PASSWORD, req);
  }

  async enterGuestMode(): Promise<Result<GuestModeRes>> {
    return this.ipcClient.invoke(AuthChannels.ENTER_GUEST_MODE);
  }

  async autoLoginDesktop(): Promise<Result<AutoLoginResult>> {
    return this.ipcClient.invoke(AuthChannels.AUTO_LOGIN);
  }

  async listRememberedAccounts(): Promise<Result<RememberedDesktopAccountDTO[]>> {
    return this.ipcClient.invoke(AuthChannels.REMEMBERED_ACCOUNTS_LIST);
  }

  async loginRememberedDesktopAccount(
    req: RememberedDesktopAccountLoginReq,
  ): Promise<Result<LoginByEmailRes>> {
    return this.ipcClient.invoke(AuthChannels.REMEMBERED_ACCOUNTS_LOGIN, req);
  }

  async removeRememberedAccount(identityId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.REMEMBERED_ACCOUNTS_REMOVE, identityId);
  }
}

export function createAuthIpcAdapter(ipcClient: IResultIpcClient): IAuthApiClient {
  return new AuthIpcAdapter(ipcClient);
}
