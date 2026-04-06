import { inject, type InjectionKey } from 'vue';
import type {
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
} from '@dailyuse/contracts/authentication';
import type { Result } from '@dailyuse/contracts/result';

export interface WebAuthService {
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>>;
  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>>;
}

export const AUTH_WEB_SERVICE_KEY: InjectionKey<WebAuthService> = Symbol('AuthWebService');

export function useAuthService(): WebAuthService {
  const service = inject(AUTH_WEB_SERVICE_KEY);
  if (service === undefined) {
    throw new Error('[web-auth] Missing injection: AuthWebService');
  }
  return service;
}
