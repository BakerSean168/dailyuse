/**
 * Authentication API Client Port Interface
 * 认证 API 客户端接口
 *
 * 定义客户端认证模块所有 API 操作的契约。
 * 实现：AuthHttpAdapter (web), AuthIpcAdapter (desktop)
 */

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

/**
 * Authentication API Client Interface
 */
export interface IAuthApiClient {
  // ========== Login ==========
  loginByEmail(req: LoginByEmailReq): Promise<LoginByEmailRes>;
  loginByPhone(req: LoginByPhoneReq): Promise<LoginByPhoneRes>;

  // ========== Register ==========
  registerByEmail(req: RegisterByEmailReq): Promise<RegisterByEmailRes>;
  registerByPhone(req: RegisterByPhoneReq): Promise<RegisterByPhoneRes>;

  // ========== SMS ==========
  sendSmsCode(req: SendSmsCodeReq): Promise<void>;

  // ========== Token ==========
  refreshToken(req: RefreshTokenReq): Promise<RefreshTokenRes>;

  // ========== Session ==========
  logout(): Promise<void>;
  getCurrentUser(): Promise<GetCurrentUserRes>;
  listSessions(): Promise<ListSessionsRes>;
  revokeSession(req: RevokeSessionReq): Promise<void>;

  // ========== Password ==========
  changePassword(req: ChangePasswordReq): Promise<void>;
  forgotPassword(req: ForgotPasswordReq): Promise<void>;
  resetPassword(req: ResetPasswordReq): Promise<void>;
}
