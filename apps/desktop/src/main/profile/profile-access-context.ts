import type { Context } from '@memoflow/contracts/shared';
import { ElectronAuthResolutionError } from '@memoflow/contracts/electron';
import type { IElectronAuthContext } from '@memoflow/contracts/electron';

/**
 * Electron business modules need a local owner, not a cloud session.
 * Cloud availability is intentionally absent from this seam.
 */
export class DesktopProfileAccessContext implements IElectronAuthContext {
  constructor(
    private readonly resolveOwner: () => string | null,
    private readonly deviceId: string = 'desktop-app',
  ) {}

  async getIdentityId(): Promise<string | null> {
    return this.resolveOwner();
  }

  async requireIdentityId(): Promise<string> {
    const identityId = this.resolveOwner();
    if (!identityId) throw new ElectronAuthResolutionError('AUTH_REQUIRED');
    return identityId;
  }

  async getSessionId(): Promise<string | null> {
    return null;
  }

  async getRequestContext(): Promise<Context | null> {
    const identityId = this.resolveOwner();
    return identityId ? { identityId, deviceId: this.deviceId } : null;
  }

  async requireRequestContext(): Promise<Context> {
    const context = await this.getRequestContext();
    if (!context) throw new ElectronAuthResolutionError('AUTH_REQUIRED');
    return context;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.resolveOwner() !== null;
  }
}
