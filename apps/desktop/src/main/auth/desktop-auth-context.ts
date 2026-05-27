import type { Context } from '@dailyuse/contracts/shared';
import { AuthRuntimeState } from '@dailyuse/contracts/authentication';
import { ElectronAuthResolutionError } from '@dailyuse/contracts/electron';
import { createLogger } from '@dailyuse/utils/logger';

import type { AuthDesktopApplicationService } from '../modules/authentication/application/auth-desktop-application-service';

const logger = createLogger('DesktopAuthContextProvider');

function createAuthResolutionError(
  code: 'AUTH_REQUIRED' | 'AUTH_RESTORING',
): ElectronAuthResolutionError {
  return new ElectronAuthResolutionError(code);
}

async function resolveRequestContext(
  service: AuthDesktopApplicationService,
): Promise<Context | null> {
  const directContext = service.getCurrentRequestContext();
  if (directContext) {
    return directContext;
  }

  const identityId = service.getCurrentIdentityId();
  if (identityId) {
    const fallbackContext = {
      identityId,
      deviceId: 'desktop-app',
    } satisfies Context;

    logger.warn('Recovered request context from identity fallback', fallbackContext);
    return fallbackContext;
  }

  return null;
}

export class DesktopAuthContextProvider {
  constructor(private readonly authService: AuthDesktopApplicationService) {}

  async getIdentityId(): Promise<string | null> {
    return this.authService.getCurrentIdentityId();
  }

  async requireIdentityId(): Promise<string> {
    if (this.authService.getRuntimeState() === AuthRuntimeState.RESTORING) {
      throw createAuthResolutionError('AUTH_RESTORING');
    }

    const identityId = await this.getIdentityId();
    if (!identityId) {
      throw createAuthResolutionError('AUTH_REQUIRED');
    }

    return identityId;
  }

  async getSessionId(): Promise<string | null> {
    return this.authService.getCurrentSessionId();
  }

  async getRequestContext(): Promise<Context | null> {
    if (this.authService.getRuntimeState() === AuthRuntimeState.RESTORING) {
      return null;
    }

    return resolveRequestContext(this.authService);
  }

  async requireRequestContext(): Promise<Context> {
    if (this.authService.getRuntimeState() === AuthRuntimeState.RESTORING) {
      logger.warn('requireRequestContext rejected: auth restoring');
      throw createAuthResolutionError('AUTH_RESTORING');
    }

    const context = await resolveRequestContext(this.authService);
    if (!context) {
      logger.warn('requireRequestContext rejected: no active request context', {
        runtimeState: this.authService.getRuntimeState(),
        identityId: this.authService.getCurrentIdentityId(),
        sessionId: this.authService.getCurrentSessionId(),
      });
      throw createAuthResolutionError('AUTH_REQUIRED');
    }

    return context;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getIdentityId()) !== null;
  }
}
