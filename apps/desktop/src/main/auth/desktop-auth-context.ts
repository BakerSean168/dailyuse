import type { Context } from '@dailyuse/contracts/shared';

import type { AuthDesktopApplicationService } from '../modules/authentication/application/AuthDesktopApplicationService';

let authService: AuthDesktopApplicationService | null = null;

export function registerDesktopAuthService(service: AuthDesktopApplicationService): void {
  authService = service;
}

export function clearDesktopAuthService(): void {
  authService = null;
}

function getRegisteredService(): AuthDesktopApplicationService {
  if (!authService) {
    throw new Error('Desktop auth service is not registered');
  }

  return authService;
}

export class DesktopAuthContextProvider {
  async getIdentityId(): Promise<string | null> {
    return getRegisteredService().getCurrentIdentityId();
  }

  async requireIdentityId(): Promise<string> {
    const identityId = await this.getIdentityId();
    if (!identityId) {
      throw new Error('AUTH_REQUIRED');
    }

    return identityId;
  }

  async getSessionId(): Promise<string | null> {
    return getRegisteredService().getCurrentSessionId();
  }

  async getRequestContext(): Promise<Context | null> {
    return getRegisteredService().getCurrentRequestContext();
  }

  async requireRequestContext(): Promise<Context> {
    const context = await this.getRequestContext();
    if (!context) {
      throw new Error('AUTH_REQUIRED');
    }

    return context;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getIdentityId()) !== null;
  }
}
