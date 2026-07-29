/**
 * Auth IPC Adapter
 *
 * IPC implementation of IAuthApiClient for Electron desktop apps.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@memoflow/contracts/result';
import { AuthChannels } from '@memoflow/contracts/electron';
import type { IAuthApiClient, IResultIpcClient } from '../types';
import type {
  AutoLoginResult,
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
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
} from '@memoflow/contracts/authentication';

export class AuthIpcAdapter implements IAuthApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return this.ipcClient.invoke(AuthChannels.LOGIN, req);
  }


  async registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return this.ipcClient.invoke(AuthChannels.REGISTER, req);
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

  async sendEmailCode(req: SendEmailCodeReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.SEND_EMAIL_CODE, req);
  }

  async verifyEmailCode(req: VerifyEmailCodeReq): Promise<Result<VerifyEmailCodeRes>> {
    return this.ipcClient.invoke(AuthChannels.VERIFY_EMAIL_CODE, req);
  }

  async getOAuthUrl(req: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>> {
    return this.ipcClient.invoke(AuthChannels.GET_OAUTH_URL, req);
  }

  async listOAuthProviders(): Promise<Result<OAuthProvidersRes>> {
    return this.ipcClient.invoke(AuthChannels.OAUTH_PROVIDERS);
  }

  async oauthCallback(req: OAuthCallbackReq): Promise<Result<OAuthCallbackRes>> {
    return this.ipcClient.invoke(AuthChannels.OAUTH_CALLBACK, req);
  }

  async bindOAuth(req: BindOAuthReq): Promise<Result<BindOAuthRes>> {
    return this.ipcClient.invoke(AuthChannels.OAUTH_BIND, req);
  }

  async unbindOAuth(req: UnbindOAuthReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AuthChannels.OAUTH_UNBIND, req);
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
