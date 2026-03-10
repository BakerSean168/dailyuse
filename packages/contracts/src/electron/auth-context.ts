import type { Context } from '../shared';

export type ElectronAuthResolutionError = 'AUTH_REQUIRED' | 'AUTH_RESTORING';

export interface IElectronAuthContext {
  getIdentityId(): Promise<string | null>;
  requireIdentityId(): Promise<string>;
  getSessionId(): Promise<string | null>;
  getRequestContext(): Promise<Context | null>;
  requireRequestContext(): Promise<Context>;
  isAuthenticated(): Promise<boolean>;
}
