import type { Context } from '../shared';

export type ElectronAuthResolutionCode = 'AUTH_REQUIRED' | 'AUTH_RESTORING';

export class ElectronAuthResolutionError extends Error {
  constructor(readonly code: ElectronAuthResolutionCode) {
    super(code);
    this.name = 'ElectronAuthResolutionError';
  }
}

export function isElectronAuthResolutionError(
  error: unknown,
): error is ElectronAuthResolutionError {
  return error instanceof ElectronAuthResolutionError;
}

export interface IElectronAuthContext {
  getIdentityId(): Promise<string | null>;
  requireIdentityId(): Promise<string>;
  getSessionId(): Promise<string | null>;
  getRequestContext(): Promise<Context | null>;
  requireRequestContext(): Promise<Context>;
  isAuthenticated(): Promise<boolean>;
}
