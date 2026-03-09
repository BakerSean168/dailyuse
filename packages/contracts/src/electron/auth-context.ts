import type { Context } from '../shared';

export interface IElectronAuthContext {
  getIdentityId(): Promise<string | null>;
  requireIdentityId(): Promise<string>;
  getSessionId(): Promise<string | null>;
  getRequestContext(): Promise<Context | null>;
  requireRequestContext(): Promise<Context>;
  isAuthenticated(): Promise<boolean>;
}
