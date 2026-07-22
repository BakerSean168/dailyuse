/**
 * DesktopMainRuntime — explicit owner of process-level dependencies.
 *
 * Replaces module-level `let runtimeManager` with a single object that
 * owns all long-lived desktop main-process dependencies:
 *   - WindowManager (window lifecycle)
 *   - DesktopProfileRuntimeManager (profile lifecycle)
 *   - NotificationService (desktop notifications)
 *
 * Created once at module load in main.ts and passed to all consumers.
 *
 * @module desktop-main-runtime
 */

import { DesktopAuthContextProvider } from './auth/desktop-auth-context';
import type { DesktopProfileRuntimeManager } from './profile';
import type { WindowManager } from './lifecycle/window-manager';
import type { NotificationService } from './services';
import type { DesktopFeaturesRuntime } from './desktop-features';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('DesktopMainRuntime');

export class DesktopMainRuntime {
  private _notificationService: NotificationService | null = null;
  private _authContextProvider: DesktopAuthContextProvider | null = null;
  private _desktopFeaturesRuntime: DesktopFeaturesRuntime | null = null;

  constructor(
    readonly windowManager: WindowManager,
    readonly profileRuntimeManager: DesktopProfileRuntimeManager,
  ) {
    // Wire auth service lifecycle: when the profile manager activates/deactivates
    // an auth service, keep the context provider in sync.
    profileRuntimeManager.onAuthServiceChanged = (service) => {
      this._authContextProvider = service ? new DesktopAuthContextProvider(service) : null;
    };
  }

  /** Get the auth context provider for the active profile (or null). */
  get authContextProvider(): DesktopAuthContextProvider | null {
    return this._authContextProvider;
  }

  /** Store the notification service instance for lifecycle management. */
  setNotificationService(service: NotificationService): void {
    this._notificationService = service;
  }

  setDesktopFeaturesRuntime(runtime: DesktopFeaturesRuntime): void {
    this._desktopFeaturesRuntime = runtime;
  }

  /**
   * Dispose all owned resources.
   * Called during application shutdown (before-quit).
   *
   * Note: WindowManager cleanup is handled by Electron's window close
   * lifecycle, not here.
   */
  async dispose(): Promise<void> {
    logger.info('Disposing DesktopMainRuntime...');

    // Deactivate the active profile (shuts down PowerSync, destroys bootstrapper)
    try {
      await this.profileRuntimeManager.deactivateProfile();
    } catch (err) {
      logger.error('Profile deactivation failed during dispose', err);
    }

    if (this._desktopFeaturesRuntime) {
      await this._desktopFeaturesRuntime.destroy();
      this._desktopFeaturesRuntime = null;
    }

    this._notificationService = null;
    logger.info('DesktopMainRuntime disposed');
  }
}
