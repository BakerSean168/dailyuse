import type {
  ForgotPasswordReq,
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
  ResetPasswordReq,
  SendEmailCodeReq,
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
} from '@dailyuse/contracts/authentication';
import type { Result } from '@dailyuse/contracts/result';
import { inject, type InjectionKey } from 'vue';

export interface WebAuthService {
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>>;
  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>>;
  forgotPassword(req: ForgotPasswordReq): Promise<Result<void>>;
  resetPassword(req: ResetPasswordReq): Promise<Result<void>>;
  sendEmailCode(req: SendEmailCodeReq): Promise<Result<void>>;
  verifyEmailCode(req: VerifyEmailCodeReq): Promise<Result<VerifyEmailCodeRes>>;
}

export const AUTH_WEB_SERVICE_KEY: InjectionKey<WebAuthService> = Symbol('AuthWebService');

export function useAuthService(): WebAuthService {
  const service = inject(AUTH_WEB_SERVICE_KEY);
  if (service === undefined) {
    throw new Error('[web-auth] Missing injection: AuthWebService');
  }
  return service;
}
