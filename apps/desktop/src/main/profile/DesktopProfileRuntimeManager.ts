import fs from 'node:fs';
import type { PowerSyncDatabase } from '@powersync/node';
import { createLogger } from '@dailyuse/utils';
import { stopScheduleRuntime } from '@dailyuse/schedule/electron-entry';
import {
  type SharedPathResolver,
  type ProfilePathResolver,
  createProfilePathResolver,
  ensureProfileDirs,
} from '../paths';
import { ProfileRegistry, type ProfileDescriptor } from './ProfileRegistry';
import { ProfileSnapshotService } from './ProfileSnapshotService';
import { ElectronBootstrapper } from '../bootstrap';
import { clearDesktopAuthService, registerDesktopAuthService } from '../auth/desktop-auth-context';
import {
  getTokenManager,
  getSessionManager,
  SessionManager,
} from '../modules/authentication/infrastructure';
import { createDesktopProfileAuthService } from '../modules/authentication/application/createDesktopProfileAuthService';
import type { AuthDesktopApplicationService } from '../modules/authentication/application/AuthDesktopApplicationService';
import {
  openPowerSyncLocalOnly,
  ensurePowerSyncSyncMode,
  shutdownPowerSync,
} from '../database/powersync';

const logger = createLogger('DesktopProfileRuntimeManager');
const GUEST_PROFILE_IDENTITY = '__desktop_guest_profile__';

export interface PreparedProfileRuntime {
  descriptor: ProfileDescriptor;
  profileResolver: ProfilePathResolver;
  db: PowerSyncDatabase;
  authService: AuthDesktopApplicationService;
}

interface PrepareProfileOptions {
  displayName?: string;
  identifier?: string | null;
  snapshotAccessToken?: string | null;
}

interface ActiveProfileRuntime extends PreparedProfileRuntime {
  bootstrapper: ElectronBootstrapper;
}

type ProfileModuleRegistration = (
  bootstrapper: ElectronBootstrapper,
  db: PowerSyncDatabase,
  profilePaths: ProfilePathResolver,
) => Promise<void>;

/**
 * DesktopProfileRuntimeManager — the single owner of desktop profile lifecycle.
 *
 * Shell auth prepares a profile first. Only after successful authentication
 * does the manager activate that prepared runtime into the full business runtime.
 */
export class DesktopProfileRuntimeManager {
  private static instance: DesktopProfileRuntimeManager | null = null;

  private readonly sharedResolver: SharedPathResolver;
  private readonly profileRegistry: ProfileRegistry;
  private readonly profileSnapshotService = new ProfileSnapshotService();

  private activeRuntime: ActiveProfileRuntime | null = null;
  private preparedRuntime: PreparedProfileRuntime | null = null;
  private activationLock: Promise<void> | null = null;
  private registerModules: ProfileModuleRegistration | null = null;

  private constructor(sharedResolver: SharedPathResolver) {
    this.sharedResolver = sharedResolver;
    this.profileRegistry = ProfileRegistry.getInstance(sharedResolver);
  }

  static getInstance(sharedResolver?: SharedPathResolver): DesktopProfileRuntimeManager {
    if (!DesktopProfileRuntimeManager.instance) {
      if (!sharedResolver) {
        throw new Error('DesktopProfileRuntimeManager requires SharedPathResolver on first init');
      }
      DesktopProfileRuntimeManager.instance = new DesktopProfileRuntimeManager(sharedResolver);
    }
    return DesktopProfileRuntimeManager.instance;
  }

  static resetInstance(): void {
    DesktopProfileRuntimeManager.instance = null;
  }

  setModuleRegistration(fn: ProfileModuleRegistration): void {
    this.registerModules = fn;
  }

  getSharedResolver(): SharedPathResolver {
    return this.sharedResolver;
  }

  getActiveProfileResolver(): ProfilePathResolver | null {
    return this.activeRuntime?.profileResolver ?? null;
  }

  getActiveProfileId(): string | null {
    return this.activeRuntime?.descriptor.profileId ?? null;
  }

  getBootstrapper(): ElectronBootstrapper | null {
    return this.activeRuntime?.bootstrapper ?? null;
  }

  getPreparedAuthService(): AuthDesktopApplicationService | null {
    return this.preparedRuntime?.authService ?? null;
  }

  getActiveAuthService(): AuthDesktopApplicationService | null {
    return this.activeRuntime?.authService ?? null;
  }

  getCurrentAuthService(): AuthDesktopApplicationService | null {
    return this.activeRuntime?.authService ?? this.preparedRuntime?.authService ?? null;
  }

  getActiveProfileDescriptor(): Promise<ProfileDescriptor | null> {
    return this.profileRegistry.getActiveProfile();
  }

  async findRegisteredProfileByIdentifier(identifier: string): Promise<ProfileDescriptor | null> {
    return await this.profileRegistry.findByIdentifier(identifier);
  }

  async prepareProfile(
    identityId: string,
    options?: PrepareProfileOptions,
  ): Promise<PreparedProfileRuntime> {
    if (this.activationLock) {
      await this.activationLock;
    }

    if (this.activeRuntime?.descriptor.identityId === identityId) {
      return this.activeRuntime;
    }

    if (this.preparedRuntime?.descriptor.identityId === identityId) {
      return this.preparedRuntime;
    }

    if (this.activeRuntime) {
      await this.deactivateProfile();
    }

    await this.disposePreparedRuntime();

    const descriptor = await this.profileRegistry.register(
      identityId,
      options?.displayName ?? options?.identifier ?? identityId,
      options?.identifier,
    );

    const profileResolver = createProfilePathResolver(this.sharedResolver.rootDir, descriptor.profileId);
    ensureProfileDirs(profileResolver);

    const snapshotResult = await this.profileSnapshotService.hydrateIfNeeded({
      sharedResolver: this.sharedResolver,
      profileResolver,
      descriptor,
      accessToken: options?.snapshotAccessToken,
    });

    if (snapshotResult.metadata) {
      await this.profileRegistry.recordSnapshotHydration(descriptor.profileId, {
        version: snapshotResult.metadata.version,
        hydratedAt: snapshotResult.metadata.hydratedAt,
      });
    } else if (snapshotResult.skippedReason === 'snapshot-unavailable') {
      await this.profileRegistry.clearSnapshotState(descriptor.profileId);
    }

    const tokenManager = getTokenManager();
    tokenManager.switchToProfile(profileResolver.tokensPath);

    const db = await openPowerSyncLocalOnly(profileResolver.dbPath);
    const authService = createDesktopProfileAuthService(db);
    registerDesktopAuthService(authService);

    const sessionManager = getSessionManager();
    sessionManager.setSharedAuthDir(this.sharedResolver.authDir);
    await sessionManager.activateProfile();

    this.preparedRuntime = {
      descriptor,
      profileResolver,
      db,
      authService,
    };

    await this.profileRegistry.markReady(descriptor.profileId);

    logger.info('Profile prepared', {
      profileId: descriptor.profileId,
      identityId: descriptor.identityId,
      snapshotHydrated: snapshotResult.hydrated,
      snapshotSkippedReason: snapshotResult.skippedReason,
    });

    return this.preparedRuntime;
  }

  async prepareGuestProfile(): Promise<PreparedProfileRuntime> {
    return await this.prepareProfile(GUEST_PROFILE_IDENTITY, {
      displayName: 'Guest',
      identifier: null,
    });
  }

  async activatePreparedProfile(options: { syncMode: 'online' | 'local' }): Promise<void> {
    if (!this.preparedRuntime) {
      throw new Error('No prepared profile is available for activation');
    }

    if (this.activationLock) {
      await this.activationLock;
      if (!this.preparedRuntime) {
        return;
      }
    }

    const activationPromise = (async () => {
      if (this.activeRuntime) {
        await this.deactivateProfile();
      }

      const prepared = this.preparedRuntime!;

      if (options.syncMode === 'online') {
        await ensurePowerSyncSyncMode();
      }

      const bootstrapper = new ElectronBootstrapper(prepared.db);
      if (this.registerModules) {
        await this.registerModules(bootstrapper, prepared.db, prepared.profileResolver);
      }
      await bootstrapper.init();

      this.activeRuntime = {
        ...prepared,
        bootstrapper,
      };
      this.preparedRuntime = null;

      await this.profileRegistry.setActiveProfile(prepared.descriptor.profileId);
      await this.profileRegistry.touch(prepared.descriptor.profileId);

      logger.info('Profile activated', {
        profileId: prepared.descriptor.profileId,
        identityId: prepared.descriptor.identityId,
        syncMode: options.syncMode,
      });
    })();

    this.activationLock = activationPromise;
    try {
      await activationPromise;
    } catch (error) {
      logger.error('Profile activation failed', { error });
      await this.profileRegistry.markError(this.preparedRuntime.descriptor.profileId).catch(
        (registryError) => logger.error('Failed to mark profile activation error', { error: registryError }),
      );
      await this.disposePreparedRuntime();
      throw error;
    } finally {
      this.activationLock = null;
    }
  }

  async discardPreparedProfile(): Promise<void> {
    await this.disposePreparedRuntime();
  }

  async deactivateProfile(): Promise<void> {
    if (!this.activeRuntime) {
      return;
    }

    logger.info('Deactivating profile', { profileId: this.activeRuntime.descriptor.profileId });

    try {
      stopScheduleRuntime();
    } catch (error) {
      logger.warn('Failed to stop schedule runtime', { error });
    }

    try {
      await this.activeRuntime.bootstrapper.destroy();
    } catch (error) {
      logger.error('Error destroying profile bootstrapper', { error });
    }

    try {
      this.activeRuntime.authService.cleanup();
    } catch (error) {
      logger.error('Error cleaning auth service during profile deactivation', { error });
    }

    try {
      await shutdownPowerSync();
    } catch (error) {
      logger.error('Error shutting down PowerSync during profile deactivation', { error });
    }

    try {
      await getTokenManager().clearForProfileSwitch();
    } catch (error) {
      logger.error('Error clearing token manager during profile deactivation', { error });
    }

    SessionManager.resetInstance();
    clearDesktopAuthService();

    const previousProfileId = this.activeRuntime.descriptor.profileId;
    this.activeRuntime = null;

    try {
      await this.profileRegistry.setActiveProfile(null);
    } catch (error) {
      logger.error('Failed to clear active profile in registry', {
        error,
        previousProfileId,
      });
    }
  }

  async removeProfile(identityId: string): Promise<void> {
    const descriptor = await this.profileRegistry.find(identityId);
    if (!descriptor) {
      logger.warn('Profile not found for removal', { identityId });
      return;
    }

    if (descriptor.profileId === this.activeRuntime?.descriptor.profileId) {
      throw new Error('Cannot remove active profile. Deactivate first.');
    }

    if (descriptor.profileId === this.preparedRuntime?.descriptor.profileId) {
      await this.disposePreparedRuntime();
    }

    const profileResolver = createProfilePathResolver(this.sharedResolver.rootDir, descriptor.profileId);

    try {
      await fs.promises.rm(profileResolver.profileDir, { recursive: true, force: true });
      logger.info('Profile directory deleted', { profileDir: profileResolver.profileDir });
    } catch (error) {
      logger.error('Failed to delete profile directory', { error });
      throw new Error(`Failed to delete profile directory: ${profileResolver.profileDir}`);
    }

    await this.profileRegistry.remove(descriptor.profileId);
    logger.info('Profile removed', { profileId: descriptor.profileId });
  }

  private async disposePreparedRuntime(): Promise<void> {
    if (!this.preparedRuntime) {
      return;
    }

    logger.info('Discarding prepared profile', {
      profileId: this.preparedRuntime.descriptor.profileId,
    });

    try {
      this.preparedRuntime.authService.cleanup();
    } catch (error) {
      logger.error('Failed to cleanup prepared auth service', { error });
    }

    try {
      await shutdownPowerSync();
    } catch (error) {
      logger.error('Failed to shutdown PowerSync for prepared profile', { error });
    }

    try {
      await getTokenManager().clearForProfileSwitch();
    } catch (error) {
      logger.error('Failed to clear token manager for prepared profile', { error });
    }

    SessionManager.resetInstance();
    clearDesktopAuthService();
    this.preparedRuntime = null;
  }
}

export function getDesktopProfileRuntimeManager(): DesktopProfileRuntimeManager {
  return DesktopProfileRuntimeManager.getInstance();
}
