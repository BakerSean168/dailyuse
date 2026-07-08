import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  RegisterByEmailReq,
  RegisterByEmailRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
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

export interface AuthenticationApplicationPort {
  register(
    data: RegisterByEmailReq,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<RegisterByEmailRes>>;
  registerByPhone(data: RegisterByPhoneReq, cx: ExecutionContext): Promise<Result<RegisterByPhoneRes>>;
  login(
    data: LoginByEmailReq,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<LoginByEmailRes>>;
  loginByPhone(data: LoginByPhoneReq, cx: ExecutionContext): Promise<Result<LoginByPhoneRes>>;
  sendSmsCode(data: SendSmsCodeReq): Promise<Result<void>>;
  logout(cx: ExecutionContext): Promise<Result<void>>;
  refreshToken(data: RefreshTokenReq, cx: ExecutionContext): Promise<Result<RefreshTokenRes>>;
  getCurrentUser(cx: ExecutionContext, sessionId?: string): Promise<Result<GetCurrentUserRes>>;
  listSessions(cx: ExecutionContext, sessionId?: string): Promise<Result<ListSessionsRes>>;
  revokeSession(data: RevokeSessionReq, cx: ExecutionContext): Promise<Result<void>>;
  changePassword(data: ChangePasswordReq, cx: ExecutionContext): Promise<Result<void>>;
  forgotPassword(data: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(data: ResetPasswordReq): Promise<Result<void>>;
}
