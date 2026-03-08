/**
 * Authentication API Client Port Interface
 * 认证 API 客户端接口
 *
 * 定义客户端认证模块所有 API 操作的契约。
 * 实现：AuthHttpAdapter (web), AuthIpcAdapter (desktop)
 *
 * 所有方法返回 Promise<Result<T>>，统一错误处理。
 */

import type { Result } from '@dailyuse/contracts/result';
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

/**
 * Authentication API Client Interface
 */
export interface IAuthApiClient {
  // ========== Login ==========
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>>;
  loginByPhone(req: LoginByPhoneReq): Promise<Result<LoginByPhoneRes>>;

  // ========== Register ==========
  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(req: RegisterByPhoneReq): Promise<Result<RegisterByPhoneRes>>;

  // ========== SMS ==========
  sendSmsCode(req: SendSmsCodeReq): Promise<Result<void>>;

  // ========== Token ==========
  refreshToken(req: RefreshTokenReq): Promise<Result<RefreshTokenRes>>;

  // ========== Session ==========
  logout(): Promise<Result<void>>;
  getCurrentUser(): Promise<Result<GetCurrentUserRes>>;
  listSessions(): Promise<Result<ListSessionsRes>>;
  revokeSession(req: RevokeSessionReq): Promise<Result<void>>;

  // ========== Password ==========
  changePassword(req: ChangePasswordReq): Promise<Result<void>>;
  forgotPassword(req: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(req: ResetPasswordReq): Promise<Result<void>>;

  // ========== Guest Mode (Desktop) ==========
  enterGuestMode(): Promise<Result<GuestModeRes>>;
}
