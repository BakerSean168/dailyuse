import type { Context } from '@dailyuse/contracts/shared';
import { AuthRuntimeState } from '@dailyuse/contracts/authentication';
import { ElectronAuthResolutionError } from '@dailyuse/contracts/electron';
import { createLogger } from '@dailyuse/utils';

import type { AuthDesktopApplicationService } from '../modules/authentication/application/AuthDesktopApplicationService';

let authService: AuthDesktopApplicationService | null = null;
const logger = createLogger('DesktopAuthContextProvider');

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

function createAuthResolutionError(
  code: 'AUTH_REQUIRED' | 'AUTH_RESTORING',
): ElectronAuthResolutionError {
  return new ElectronAuthResolutionError(code);
}

export function getDesktopAuthService(): AuthDesktopApplicationService {
  return getRegisteredService();
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
  async getIdentityId(): Promise<string | null> {
    return getRegisteredService().getCurrentIdentityId();
  }

  async requireIdentityId(): Promise<string> {
    const service = getRegisteredService();
    if (service.getRuntimeState() === AuthRuntimeState.RESTORING) {
      throw createAuthResolutionError('AUTH_RESTORING');
    }

    const identityId = await this.getIdentityId();
    if (!identityId) {
      throw createAuthResolutionError('AUTH_REQUIRED');
    }

    return identityId;
  }

  async getSessionId(): Promise<string | null> {
    return getRegisteredService().getCurrentSessionId();
  }

  async getRequestContext(): Promise<Context | null> {
    const service = getRegisteredService();
    if (service.getRuntimeState() === AuthRuntimeState.RESTORING) {
      return null;
    }

    return resolveRequestContext(service);
  }

  async requireRequestContext(): Promise<Context> {
    const service = getRegisteredService();
    if (service.getRuntimeState() === AuthRuntimeState.RESTORING) {
      logger.warn('requireRequestContext rejected: auth restoring');
      throw createAuthResolutionError('AUTH_RESTORING');
    }

    const context = await resolveRequestContext(service);
    if (!context) {
      logger.warn('requireRequestContext rejected: no active request context', {
        runtimeState: service.getRuntimeState(),
        identityId: service.getCurrentIdentityId(),
        sessionId: service.getCurrentSessionId(),
      });
      throw createAuthResolutionError('AUTH_REQUIRED');
    }

    return context;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getIdentityId()) !== null;
  }
}
